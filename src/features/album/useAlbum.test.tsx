import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAlbum } from './useAlbum';
import { QueryKeys } from '@/state/query/queryKeys';
import serversReducer, { addServer, setActiveServer } from '@/state/redux/slices/serversSlice';
import { makeLocalId } from '@/domain/identity/LocalId';
import { serverProvenance } from '@/domain/identity/Provenance';
import type { Album } from '@/domain/entities/Album';
import type { Song } from '@/domain/entities/Song';
import type { AlbumDetail } from '@/domain/entities/Detail';

let mockOnline = true;
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: mockOnline, isInternetReachable: mockOnline }),
}));

const mockGetAlbum = jest.fn<Promise<AlbumDetail>, [string]>();
jest.mock('@/providers/registry/useApi', () => ({
  useApi: () => ({ albums: { get: mockGetAlbum } }),
}));

// The offline fallback is not what is under test, and the real store would
// fetch the whole catalog to build itself.
jest.mock('@/features/library/useCatalogStore', () => ({
  useCatalogStore: () => ({ albumByNativeId: new Map(), songByNativeId: new Map(), songIdsByAlbum: new Map() }),
}));

const SERVER_ID = 'server-1';
const PROVENANCE = serverProvenance(SERVER_ID);

const album: Album = {
  localId: makeLocalId('album', PROVENANCE, 'al-1'),
  nativeId: 'al-1',
  provenance: PROVENANCE,
  externalIds: {},
  title: 'Deluxe',
  cover: { kind: 'none' },
  artist: { localId: makeLocalId('artist', PROVENANCE, 'ar-1'), nativeId: 'ar-1', externalIds: {}, name: 'Artist', cover: { kind: 'none' } },
  year: 2026,
  releaseType: 'album',
  genres: [],
  songIds: [],
};

function song(nativeId: string): Song {
  return {
    localId: makeLocalId('song', PROVENANCE, nativeId),
    nativeId,
    provenance: PROVENANCE,
    externalIds: {},
    title: nativeId,
    artist: album.artist,
    album: { localId: album.localId, nativeId: album.nativeId, externalIds: {}, title: album.title, cover: { kind: 'none' } },
    cover: { kind: 'none' },
    durationSeconds: 200,
    contentKind: 'song',
    genres: [],
  };
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // What an earlier visit left in the persisted cache: the original release.
  queryClient.setQueryData<AlbumDetail>([QueryKeys.Album, SERVER_ID, 'al-1'], { album, songs: [song('s1')] });

  const store = configureStore({ reducer: { servers: serversReducer } });
  store.dispatch(addServer({ id: SERVER_ID, type: 'jellyfin', serverUrl: 'https://example.com', username: 'u', isAuthenticated: true }));
  store.dispatch(setActiveServer(SERVER_ID));

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>{children}</Provider>
    </QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('useAlbum refresh', () => {
  beforeEach(() => {
    mockOnline = true;
    mockGetAlbum.mockReset();
  });

  it('picks up tracks added to an album since it was cached (#315)', async () => {
    mockGetAlbum.mockResolvedValue({ album, songs: [song('s1'), song('s2')] });
    const { queryClient, wrapper } = setup();

    const { result, unmount } = await renderHook(() => useAlbum('al-1'), { wrapper });
    // The cached detail is served as-is: nothing asks the server on its own.
    expect(result.current.songs.map(s => s.nativeId)).toEqual(['s1']);
    expect(mockGetAlbum).not.toHaveBeenCalled();

    await act(async () => { result.current.refresh(); });

    await waitFor(() => expect(result.current.songs.map(s => s.nativeId)).toEqual(['s1', 's2']));
    expect(mockGetAlbum).toHaveBeenCalledWith('al-1');

    await unmount();
    queryClient.clear();
  });

  it('does not ask a server it cannot reach', async () => {
    mockOnline = false;
    const { queryClient, wrapper } = setup();

    const { result, unmount } = await renderHook(() => useAlbum('al-1'), { wrapper });
    await act(async () => { result.current.refresh(); });

    expect(mockGetAlbum).not.toHaveBeenCalled();
    expect(result.current.songs.map(s => s.nativeId)).toEqual(['s1']);

    await unmount();
    queryClient.clear();
  });
});
