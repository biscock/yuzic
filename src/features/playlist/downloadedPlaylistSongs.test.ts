import { downloadedPlaylistSongs } from './downloadedPlaylistSongs';
import type { Song } from '@/domain/entities/Song';
import type { DownloadedCollectionEntry } from '@/features/offline/downloadStore';
import { serverProvenance } from '@/domain/identity/Provenance';
import { makeLocalId } from '@/domain/identity/LocalId';

const SERVER = serverProvenance('srv-1');
const OTHER = serverProvenance('srv-2');

function makeSong(nativeId: string): Song {
  return {
    localId: makeLocalId('song', SERVER, nativeId),
    nativeId,
    provenance: SERVER,
    externalIds: {},
    title: nativeId,
    artist: { localId: makeLocalId('artist', SERVER, 'ar1'), nativeId: 'ar1', externalIds: {}, name: 'Keane', cover: { kind: 'none' } },
    album: { localId: makeLocalId('album', SERVER, 'al1'), nativeId: 'al1', externalIds: {}, title: 'Hopes and Fears', cover: { kind: 'none' } },
    cover: { kind: 'none' },
    durationSeconds: 237,
    contentKind: 'song',
    genres: [],
  };
}

const catalog = new Map(['a', 'b', 'c'].map(id => [id, makeSong(id)]));

const playlist = (id: string, trackIds: string[]): DownloadedCollectionEntry => ({
  id,
  type: 'playlist',
  trackIds,
  downloadedAt: 0,
});

describe('downloadedPlaylistSongs', () => {
  it('gives a downloaded playlist its saved tracks, in the order they were saved', () => {
    const collections = [playlist('pl-1', ['c', 'a'].map(id => makeLocalId('song', SERVER, id)))];

    expect(downloadedPlaylistSongs(collections, 'pl-1', 'srv-1', catalog).map(song => song.nativeId))
      .toEqual(['c', 'a']);
  });

  it('gives a playlist that was not downloaded no tracks', () => {
    const collections = [playlist('pl-1', [makeLocalId('song', SERVER, 'a')])];

    expect(downloadedPlaylistSongs(collections, 'pl-2', 'srv-1', catalog)).toEqual([]);
  });

  it('does not take an album with the same id for the playlist', () => {
    const collections: DownloadedCollectionEntry[] = [
      { id: 'pl-1', type: 'album', trackIds: [makeLocalId('song', SERVER, 'a')], downloadedAt: 0 },
    ];

    expect(downloadedPlaylistSongs(collections, 'pl-1', 'srv-1', catalog)).toEqual([]);
  });

  it('leaves out tracks saved from another server and tracks the catalog no longer holds', () => {
    const collections = [playlist('pl-1', [
      makeLocalId('song', OTHER, 'a'),
      makeLocalId('song', SERVER, 'gone'),
      makeLocalId('song', SERVER, 'b'),
      'not-a-local-id',
    ])];

    expect(downloadedPlaylistSongs(collections, 'pl-1', 'srv-1', catalog).map(song => song.nativeId))
      .toEqual(['b']);
  });
});
