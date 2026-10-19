import type { Song } from '@/domain/entities/Song';
import { parseLocalId } from '@/domain/identity/LocalId';
import type { DownloadedCollectionEntry } from '@/features/offline/downloadStore';

/**
 * The tracks of a downloaded playlist, in the order they were saved, for a
 * playlist screen opened while the server cannot be asked.
 *
 * A playlist's tracks are not in the catalog's playlist record, so the
 * offline fallback used to be the playlist and an empty list — and a
 * downloaded playlist whose detail had never been cached, or had been
 * dropped, showed nothing while every one of its tracks sat on the device
 * (#317). The download recorded which tracks it saved; the catalog has them.
 *
 * Track ids are `localId`s, so one saved from another server is left out
 * rather than matched to whatever happens to share its native id here. A
 * track the catalog no longer holds is left out too.
 */
export function downloadedPlaylistSongs(
  collections: readonly DownloadedCollectionEntry[],
  playlistId: string,
  serverId: string,
  songByNativeId: ReadonlyMap<string, Song>,
): Song[] {
  const collection = collections.find(entry => entry.type === 'playlist' && entry.id === playlistId);
  if (!collection) return [];

  return collection.trackIds.flatMap(trackId => {
    const parsed = parseLocalId(trackId);
    if (parsed?.kind !== 'song') return [];
    if (parsed.provenance.origin !== 'server' || parsed.provenance.serverId !== serverId) return [];
    const song = songByNativeId.get(parsed.nativeId);
    return song ? [song] : [];
  });
}
