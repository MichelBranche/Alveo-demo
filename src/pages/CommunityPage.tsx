import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import CommunityGifPicker from '../components/CommunityGifPicker'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import { getDiarySupabase } from '../lib/diaryCloud'
import { buildCommunityGifBody, parseCommunityGifUrl } from '../lib/communityGif'
import {
  acceptFriendRequestRpc,
  COMMUNITY_DM_BODY_MAX,
  COMMUNITY_DM_INITIAL,
  COMMUNITY_DM_PAGE,
  COMMUNITY_GLOBAL_BODY_MAX,
  COMMUNITY_GLOBAL_INITIAL,
  COMMUNITY_GLOBAL_PAGE,
  fetchCommunityProfiles,
  fetchCommunityOnlineCount,
  fetchDirectMessages,
  fetchGlobalMessages,
  fetchMyCommunityProfile,
  addCommunityProfilePhoto,
  deleteCommunityProfilePhoto,
  listCommunityProfilePhotos,
  listFriendRequests,
  listFriendships,
  listFriendshipsInvolvingUser,
  otherFriendId,
  rejectFriendRequest,
  sanitizeCommunityBody,
  readSupabaseClientMessage,
  searchCommunityProfiles,
  sendDirectMessage,
  sendFriendRequest,
  sendGlobalMessage,
  subscribeDirectMessages,
  subscribeGlobalMessages,
  touchCommunityOnline,
  upsertCommunityProfile,
  type CommunityProfile,
  type CommunityProfilePhotoRow,
  type DirectMessageRow,
  type FriendRequestRow,
  type FriendshipRow,
  type GlobalMessageRow,
} from '../lib/communityCloud'
import type { NavId } from '../nav'

function CommunityMessageBody({ body, mine }: { body: string; mine: boolean }) {
  const gifUrl = parseCommunityGifUrl(body)
  if (gifUrl) {
    return (
      <div className="max-w-[min(260px,78vw)]">
        <img
          src={gifUrl}
          alt={mine ? 'La tua GIF' : 'GIF inviata'}
          className="max-h-52 w-full rounded-xl object-contain"
          loading="lazy"
        />
      </div>
    )
  }
  return <p className="whitespace-pre-wrap break-words">{body}</p>
}

function dmBodySnippet(body: string, max = 44): string {
  const gif = parseCommunityGifUrl(body)
  if (gif) return 'GIF'
  const t = body.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

function communityHandleFromDisplayName(displayName: string): string {
  const raw = displayName.trim() || 'utente'
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 28)
}

function tabBtn(active: boolean, children: ReactNode, onClick: () => void) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active ?
          'w-full min-w-0 justify-center rounded-lg border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-1.5 py-2 text-center text-[11px] font-bold leading-snug text-white shadow-[2px_2px_0px_#ffffff] sm:rounded-xl sm:px-3 sm:text-sm'
        : 'w-full min-w-0 justify-center rounded-lg border-2 border-[#1A1A1A]/30 bg-white px-1.5 py-2 text-center text-[11px] font-semibold leading-snug text-[#374550] transition hover:border-[#1A1A1A]/50 sm:rounded-xl sm:px-3 sm:text-sm'
      }
    >
      {children}
    </button>
  )
}

function ProfileFriendsAndGallery({
  friends,
  photos,
  loading,
  isOwn,
  onOpenProfile,
  newPhotoUrl,
  onNewPhotoUrlChange,
  onPublishPhoto,
  onDeletePhoto,
  mutating,
}: {
  friends: CommunityProfile[]
  photos: CommunityProfilePhotoRow[]
  loading: boolean
  isOwn: boolean
  onOpenProfile: (userId: string) => void
  newPhotoUrl: string
  onNewPhotoUrlChange: (v: string) => void
  onPublishPhoto: () => void
  onDeletePhoto: (photoId: string) => void
  mutating: boolean
}) {
  const emptyPhotosLabel = isOwn ?
    'Non hai ancora pubblicato nulla.'
  : 'Questo account non ha ancora pubblicato nulla.'
  const emptyFriendsLabel = isOwn ?
    'Non hai ancora amici in community.'
  : 'Nessun amico da mostrare.'

  return (
    <>
      <section className="mt-8 w-full max-w-md text-left">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c6b72]">Amici</h3>
        {loading ?
          <p className="mt-2 text-sm text-gray-500">Caricamento…</p>
        : friends.length === 0 ?
          <p className="mt-2 text-sm text-gray-600">{emptyFriendsLabel}</p>
        : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {friends.map((f) => (
              <li key={f.user_id}>
                <button
                  type="button"
                  onClick={() => onOpenProfile(f.user_id)}
                  className="flex flex-col items-center gap-1 rounded-xl border-2 border-transparent p-1 transition hover:border-[#1A1A1A]/25 hover:bg-white/80"
                >
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-[#1A1A1A] bg-[#eae5df] text-sm font-bold text-[#162327]">
                    {f.avatar_url ?
                      <img src={f.avatar_url} alt="" className="h-full w-full object-cover" />
                    : (f.display_name || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="max-w-[4.5rem] truncate text-center text-[10px] font-semibold text-[#374550]">
                    {f.display_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 w-full max-w-md text-left">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c6b72]">Foto pubblicate</h3>
        {isOwn ?
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              value={newPhotoUrl}
              onChange={(e) => onNewPhotoUrlChange(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-2 border-[#1A1A1A]/30 bg-white px-3 py-2 text-sm"
              placeholder="URL immagine HTTPS…"
              maxLength={2048}
            />
            <button
              type="button"
              disabled={mutating || !newPhotoUrl.trim().startsWith('https://')}
              onClick={() => onPublishPhoto()}
              className="shrink-0 rounded-xl border-[3px] border-[#1A1A1A] bg-[#f9e784] px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_#1A1A1A] disabled:opacity-40"
            >
              {mutating ? '…' : 'Pubblica'}
            </button>
          </div>
        : null}
        {loading ?
          <p className="mt-3 text-sm text-gray-500">Caricamento…</p>
        : photos.length === 0 ?
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{emptyPhotosLabel}</p>
        : (
          <ul className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
            {photos.map((ph) => (
              <li key={ph.id} className="group relative aspect-square overflow-hidden rounded-lg border-2 border-[#1A1A1A]/15 bg-[#f4f0ea]">
                <img
                  src={ph.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {isOwn ?
                  <button
                    type="button"
                    aria-label="Rimuovi foto"
                    disabled={mutating}
                    onClick={() => onDeletePhoto(ph.id)}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-white/95 text-sm font-bold text-[#162327] opacity-0 shadow-sm transition hover:bg-[#fde8e8] group-hover:opacity-100 disabled:opacity-40 sm:opacity-100"
                  >
                    ×
                  </button>
                : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default function CommunityPage({ onSelectNav }: { onSelectNav: (id: NavId) => void }) {
  const { cloudEnabled, session, initializing, canUseDiary } = useDiaryAuth()
  const sb = useMemo(() => getDiarySupabase(), [])
  const uid = session?.user?.id ?? null

  const [tab, setTab] = useState<'chat' | 'friends' | 'profile'>('chat')
  /** Vista raccolta vs schermata modifica profilo (solo tab Profilo). */
  const [profileEditing, setProfileEditing] = useState(false)
  /** In tab Profilo: `null` = il tuo profilo; altrimenti id utente da mostrare (sola lettura). */
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null)
  const [globalMessages, setGlobalMessages] = useState<GlobalMessageRow[]>([])
  const [profileMap, setProfileMap] = useState<Map<string, CommunityProfile>>(new Map())
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [globalBusy, setGlobalBusy] = useState(false)
  const [globalLoadingOlder, setGlobalLoadingOlder] = useState(false)
  const [globalHasMore, setGlobalHasMore] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [draftGlobal, setDraftGlobal] = useState('')

  const [myProfile, setMyProfile] = useState<CommunityProfile | null>(null)
  const [profileNameDraft, setProfileNameDraft] = useState('')
  const [profileAvatarDraft, setProfileAvatarDraft] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [requests, setRequests] = useState<FriendRequestRow[]>([])
  const [friendships, setFriendships] = useState<FriendshipRow[]>([])
  const [friendsBusy, setFriendsBusy] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchHits, setSearchHits] = useState<CommunityProfile[]>([])
  const [dmPeer, setDmPeer] = useState<CommunityProfile | null>(null)
  const [dmRows, setDmRows] = useState<DirectMessageRow[]>([])
  const [dmLoadingOlder, setDmLoadingOlder] = useState(false)
  const [dmHasMore, setDmHasMore] = useState(true)
  const [draftDm, setDraftDm] = useState('')
  const [gifPickerOpen, setGifPickerOpen] = useState(false)
  const [gifTarget, setGifTarget] = useState<'global' | 'dm'>('global')
  const [gifPickerNonce, setGifPickerNonce] = useState(0)
  const [friendFilter, setFriendFilter] = useState('')
  const [friendsMobileThread, setFriendsMobileThread] = useState(false)
  const [dmPreviewByPeer, setDmPreviewByPeer] = useState<Map<string, string>>(() => new Map())
  const [findPeopleOpen, setFindPeopleOpen] = useState(false)
  const [profileGalleryPhotos, setProfileGalleryPhotos] = useState<CommunityProfilePhotoRow[]>([])
  const [profileGalleryFriends, setProfileGalleryFriends] = useState<CommunityProfile[]>([])
  const [profileGalleryLoading, setProfileGalleryLoading] = useState(false)
  const [newProfilePhotoUrl, setNewProfilePhotoUrl] = useState('')
  const [galleryMutating, setGalleryMutating] = useState(false)

  const globalListRef = useRef<HTMLDivElement>(null)
  const preserveGlobalScrollRef = useRef<{ h: number; t: number } | null>(null)
  const scrollGlobalBottomRef = useRef(false)
  const dmListRef = useRef<HTMLDivElement>(null)
  const preserveDmScrollRef = useRef<{ h: number; t: number } | null>(null)
  const scrollDmBottomRef = useRef(false)
  const rtGlobalRef = useRef<RealtimeChannel | null>(null)
  const rtDmRef = useRef<RealtimeChannel | null>(null)
  const hbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const globalMessagesRef = useRef<GlobalMessageRow[]>([])
  const wireGlobalRtRef = useRef<() => void>(() => {})
  const prevCommunityTabRef = useRef<'chat' | 'friends' | 'profile'>(tab)
  globalMessagesRef.current = globalMessages

  const refreshProfilesForMessages = useCallback(
    async (rows: GlobalMessageRow[]) => {
      if (!sb) return
      const ids = [...new Set(rows.map((r) => r.user_id))]
      const m = await fetchCommunityProfiles(sb, ids)
      setProfileMap((prev) => new Map([...prev, ...m]))
    },
    [sb],
  )

  const loadGlobal = useCallback(async () => {
    if (!sb) return
    setGlobalBusy(true)
    setGlobalError(null)
    try {
      const rows = await fetchGlobalMessages(sb)
      setGlobalMessages(rows)
      setGlobalHasMore(rows.length >= COMMUNITY_GLOBAL_INITIAL)
      scrollGlobalBottomRef.current = true
      try {
        await refreshProfilesForMessages(rows)
      } catch {
        /* profili secondari: la chat resta visibile anche se i nomi non arrivano */
      }
    } catch (e) {
      setGlobalError(readSupabaseClientMessage(e) || 'Errore caricamento chat')
    } finally {
      setGlobalBusy(false)
    }
  }, [sb, refreshProfilesForMessages])

  const loadOlderGlobal = useCallback(async () => {
    if (!sb || globalMessages.length === 0 || globalLoadingOlder || !globalHasMore) return
    const el = globalListRef.current
    if (el) preserveGlobalScrollRef.current = { h: el.scrollHeight, t: el.scrollTop }
    const oldest = globalMessages[0]
    setGlobalLoadingOlder(true)
    setGlobalError(null)
    try {
      const older = await fetchGlobalMessages(sb, {
        limit: COMMUNITY_GLOBAL_PAGE,
        beforeCreatedAt: oldest.created_at,
      })
      const existing = new Set(globalMessages.map((m) => m.id))
      const merged = older.filter((m) => !existing.has(m.id))
      setGlobalMessages((prev) => [...merged, ...prev])
      setGlobalHasMore(older.length >= COMMUNITY_GLOBAL_PAGE)
      if (merged.length > 0) {
        try {
          await refreshProfilesForMessages(merged)
        } catch {
          /* vedi loadGlobal */
        }
      }
    } catch (e) {
      setGlobalError(readSupabaseClientMessage(e) || 'Errore caricamento storico')
    } finally {
      setGlobalLoadingOlder(false)
    }
  }, [sb, globalMessages, globalLoadingOlder, globalHasMore, refreshProfilesForMessages])

  const mergeProfile = useCallback((p: CommunityProfile) => {
    setProfileMap((prev) => new Map(prev).set(p.user_id, p))
  }, [])

  /** Allinea messaggi persi (tab in background / WebSocket in pausa su desktop) senza perdere lo storico “carica precedenti”. */
  const mergeGlobalCatchUp = useCallback(async () => {
    if (!sb) return
    try {
      const rows = await fetchGlobalMessages(sb)
      const prev = globalMessagesRef.current
      const prevIds = new Set(prev.map((m) => m.id))
      let anyNew = false
      for (const r of rows) {
        if (!prevIds.has(r.id)) anyNew = true
      }
      const byId = new Map(prev.map((m) => [m.id, m]))
      for (const r of rows) byId.set(r.id, r)
      const next = [...byId.values()].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      setGlobalMessages(next)
      if (anyNew) scrollGlobalBottomRef.current = true
      try {
        await refreshProfilesForMessages(rows)
      } catch {
        /* */
      }
    } catch {
      /* */
    }
  }, [sb, refreshProfilesForMessages])

  const wireGlobalRealtime = useCallback(() => {
    if (!sb || !uid) return
    rtGlobalRef.current?.unsubscribe()
    rtGlobalRef.current = subscribeGlobalMessages(
      sb,
      (row) => {
        scrollGlobalBottomRef.current = true
        setGlobalMessages((p) => (p.some((x) => x.id === row.id) ? p : [...p, row]))
        void fetchCommunityProfiles(sb, [row.user_id]).then((m) => {
          const pr = m.get(row.user_id)
          if (pr) mergeProfile(pr)
        })
      },
      uid,
    )
  }, [sb, uid, mergeProfile])

  wireGlobalRtRef.current = wireGlobalRealtime

  useEffect(() => {
    if (!sb || !uid || !canUseDiary) return
    void loadGlobal()
  }, [sb, uid, canUseDiary, loadGlobal])

  useEffect(() => {
    if (!sb || !uid || !canUseDiary) return
    wireGlobalRealtime()
    return () => {
      rtGlobalRef.current?.unsubscribe()
      rtGlobalRef.current = null
    }
  }, [sb, uid, canUseDiary, wireGlobalRealtime])

  useEffect(() => {
    if (!sb || !uid || !canUseDiary) return
    let t: ReturnType<typeof setTimeout> | null = null
    const scheduleHeal = () => {
      if (t) clearTimeout(t)
      t = window.setTimeout(() => {
        t = null
        if (tab === 'chat') void mergeGlobalCatchUp()
        wireGlobalRtRef.current()
      }, 320)
    }
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      scheduleHeal()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', scheduleHeal)
    return () => {
      if (t) clearTimeout(t)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', scheduleHeal)
    }
  }, [sb, uid, canUseDiary, tab, mergeGlobalCatchUp])

  useEffect(() => {
    const from = prevCommunityTabRef.current
    prevCommunityTabRef.current = tab
    if (tab !== 'chat' || !sb || !uid || !canUseDiary) return
    if (from === 'chat') return
    void mergeGlobalCatchUp()
  }, [tab, sb, uid, canUseDiary, mergeGlobalCatchUp])

  useLayoutEffect(() => {
    const el = globalListRef.current
    const p = preserveGlobalScrollRef.current
    if (el && p) {
      el.scrollTop = el.scrollHeight - p.h + p.t
      preserveGlobalScrollRef.current = null
      return
    }
    if (el && scrollGlobalBottomRef.current) {
      el.scrollTop = el.scrollHeight
      scrollGlobalBottomRef.current = false
    }
  }, [globalMessages])

  useLayoutEffect(() => {
    const el = dmListRef.current
    const p = preserveDmScrollRef.current
    if (el && p) {
      el.scrollTop = el.scrollHeight - p.h + p.t
      preserveDmScrollRef.current = null
      return
    }
    if (el && scrollDmBottomRef.current) {
      el.scrollTop = el.scrollHeight
      scrollDmBottomRef.current = false
    }
  }, [dmRows])

  useEffect(() => {
    if (!sb || !uid || !canUseDiary) return
    const tick = () => {
      void touchCommunityOnline(sb, uid).catch(() => {})
      void fetchCommunityOnlineCount(sb)
        .then(setOnlineCount)
        .catch(() => setOnlineCount(null))
    }
    tick()
    hbTimerRef.current = window.setInterval(tick, 22_000)
    return () => {
      if (hbTimerRef.current) window.clearInterval(hbTimerRef.current)
      hbTimerRef.current = null
    }
  }, [sb, uid, canUseDiary])

  useEffect(() => {
    if (!sb || !uid || !canUseDiary) return
    void (async () => {
      try {
        let p = await fetchMyCommunityProfile(sb, uid)
        if (!p) {
          const meta = session?.user?.user_metadata as Record<string, unknown> | undefined
          const dn =
            typeof meta?.display_name === 'string' && meta.display_name.trim() ?
              meta.display_name.trim()
            : typeof meta?.full_name === 'string' && meta.full_name.trim() ?
              meta.full_name.trim()
            : session?.user?.email?.split('@')[0] ?? 'Utente'
          await upsertCommunityProfile(sb, uid, { display_name: dn })
          p = await fetchMyCommunityProfile(sb, uid)
        }
        setMyProfile(p)
        setProfileNameDraft(p?.display_name ?? '')
        setProfileAvatarDraft(p?.avatar_url ?? '')
      } catch {
        /* ignore */
      }
    })()
  }, [sb, uid, canUseDiary, session])

  const reloadFriends = useCallback(async () => {
    if (!sb || !uid) return
    setFriendsBusy(true)
    try {
      const [r, f] = await Promise.all([listFriendRequests(sb, uid), listFriendships(sb, uid)])
      setRequests(r)
      setFriendships(f)
      const otherIds = f.map((row) => otherFriendId(row, uid))
      const pmap = await fetchCommunityProfiles(sb, otherIds)
      setProfileMap((prev) => new Map([...prev, ...pmap]))
    } catch {
      /* */
    } finally {
      setFriendsBusy(false)
    }
  }, [sb, uid])

  const openDmWithFriend = useCallback(
    (oid: string) => {
      const pr = profileMap.get(oid)
      setDmPeer(
        pr ?? {
          user_id: oid,
          display_name: 'Utente',
          avatar_url: null,
          updated_at: new Date().toISOString(),
        },
      )
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
        setFriendsMobileThread(true)
      }
      if (!sb) return
      void fetchCommunityProfiles(sb, [oid]).then((m) => {
        const p = m.get(oid)
        if (p) setDmPeer(p)
      })
    },
    [sb, profileMap],
  )

  useEffect(() => {
    if (!sb || !uid || !canUseDiary || (tab !== 'friends' && tab !== 'profile')) return
    void reloadFriends()
  }, [sb, uid, canUseDiary, tab, reloadFriends])

  useEffect(() => {
    if (tab !== 'friends') setFriendsMobileThread(false)
  }, [tab])

  useEffect(() => {
    if (!dmPeer || dmRows.length === 0 || !uid) return
    const last = dmRows[dmRows.length - 1]
    const base = dmBodySnippet(last.body, 40)
    const snippet = last.sender_id === uid ? `Tu: ${base}` : base
    setDmPreviewByPeer((prev) => {
      if (prev.get(dmPeer.user_id) === snippet) return prev
      const next = new Map(prev)
      next.set(dmPeer.user_id, snippet)
      return next
    })
  }, [dmPeer, dmRows, uid])

  useEffect(() => {
    if (tab !== 'profile') setProfileEditing(false)
  }, [tab])

  useEffect(() => {
    if (!sb || !uid || !dmPeer || !canUseDiary) {
      rtDmRef.current?.unsubscribe()
      rtDmRef.current = null
      return
    }
    void (async () => {
      try {
        const rows = await fetchDirectMessages(sb, uid, dmPeer.user_id)
        setDmHasMore(rows.length >= COMMUNITY_DM_INITIAL)
        scrollDmBottomRef.current = true
        setDmRows(rows)
      } catch {
        setDmHasMore(false)
        setDmRows([])
      }
    })()
    rtDmRef.current?.unsubscribe()
    rtDmRef.current = subscribeDirectMessages(sb, uid, dmPeer.user_id, (row) => {
      scrollDmBottomRef.current = true
      setDmRows((prev) => (prev.some((x) => x.id === row.id) ? prev : [...prev, row]))
    })
    return () => {
      rtDmRef.current?.unsubscribe()
      rtDmRef.current = null
    }
  }, [sb, uid, dmPeer, canUseDiary])

  const loadOlderDm = useCallback(async () => {
    if (!sb || !uid || !dmPeer || dmRows.length === 0 || dmLoadingOlder || !dmHasMore) return
    const el = dmListRef.current
    if (el) preserveDmScrollRef.current = { h: el.scrollHeight, t: el.scrollTop }
    const oldest = dmRows[0]
    setDmLoadingOlder(true)
    try {
      const older = await fetchDirectMessages(sb, uid, dmPeer.user_id, {
        limit: COMMUNITY_DM_PAGE,
        beforeCreatedAt: oldest.created_at,
      })
      const existing = new Set(dmRows.map((m) => m.id))
      const merged = older.filter((m) => !existing.has(m.id))
      setDmRows((prev) => [...merged, ...prev])
      setDmHasMore(older.length >= COMMUNITY_DM_PAGE)
    } catch {
      /* */
    } finally {
      setDmLoadingOlder(false)
    }
  }, [sb, uid, dmPeer, dmRows, dmLoadingOlder, dmHasMore])

  const onSendGlobal = useCallback(async () => {
    if (!sb || !uid) return
    const body = sanitizeCommunityBody(draftGlobal, COMMUNITY_GLOBAL_BODY_MAX)
    if (!body) return
    setDraftGlobal('')
    try {
      scrollGlobalBottomRef.current = true
      await sendGlobalMessage(sb, uid, body)
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'Invio non riuscito')
    }
  }, [sb, uid, draftGlobal])

  const onSearchUsers = useCallback(async () => {
    if (!sb || !uid) return
    try {
      setSearchHits(await searchCommunityProfiles(sb, searchQ, uid))
    } catch {
      setSearchHits([])
    }
  }, [sb, uid, searchQ])

  const onRequestFriend = useCallback(
    async (toUserId: string) => {
      if (!sb || !uid) return
      try {
        await sendFriendRequest(sb, uid, toUserId)
        await reloadFriends()
        setSearchHits([])
        setSearchQ('')
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Richiesta non inviata (forse già in sospeso).')
      }
    },
    [sb, uid, reloadFriends],
  )

  const onAccept = useCallback(
    async (id: string) => {
      if (!sb) return
      try {
        await acceptFriendRequestRpc(sb, id)
        await reloadFriends()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Accettazione non riuscita')
      }
    },
    [sb, reloadFriends],
  )

  const onReject = useCallback(
    async (id: string) => {
      if (!sb) return
      try {
        await rejectFriendRequest(sb, id)
        await reloadFriends()
      } catch {
        /* */
      }
    },
    [sb, reloadFriends],
  )

  const closeProfileEdit = useCallback(() => {
    setProfileEditing(false)
    if (myProfile) {
      setProfileNameDraft(myProfile.display_name)
      setProfileAvatarDraft(myProfile.avatar_url ?? '')
    }
  }, [myProfile])

  const onSaveProfile = useCallback(async () => {
    if (!sb || !uid) return
    setProfileSaving(true)
    try {
      await upsertCommunityProfile(sb, uid, {
        display_name: profileNameDraft,
        avatar_url: profileAvatarDraft.trim() || null,
      })
      const p = await fetchMyCommunityProfile(sb, uid)
      setMyProfile(p)
      if (p) mergeProfile(p)
      setProfileEditing(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Salvataggio non riuscito')
    } finally {
      setProfileSaving(false)
    }
  }, [sb, uid, profileNameDraft, profileAvatarDraft, mergeProfile])

  const onSendDm = useCallback(async () => {
    if (!sb || !uid || !dmPeer) return
    const body = sanitizeCommunityBody(draftDm, COMMUNITY_DM_BODY_MAX)
    if (!body) return
    setDraftDm('')
    try {
      scrollDmBottomRef.current = true
      await sendDirectMessage(sb, uid, dmPeer.user_id, body)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Messaggio non inviato (serve amicizia accettata).')
    }
  }, [sb, uid, dmPeer, draftDm])

  const openGifPicker = useCallback((target: 'global' | 'dm') => {
    setGifTarget(target)
    setGifPickerNonce((n) => n + 1)
    setGifPickerOpen(true)
  }, [])

  const onGifPicked = useCallback(
    async (url: string) => {
      if (!sb || !uid) return
      const max = gifTarget === 'global' ? COMMUNITY_GLOBAL_BODY_MAX : COMMUNITY_DM_BODY_MAX
      const body = buildCommunityGifBody(url, max)
      if (!body) {
        alert('URL GIF non consentito: usa un link HTTPS da Giphy o Tenor (file .gif).')
        return
      }
      setGifPickerOpen(false)
      try {
        if (gifTarget === 'global') {
          scrollGlobalBottomRef.current = true
          await sendGlobalMessage(sb, uid, body)
        } else {
          if (!dmPeer) return
          scrollDmBottomRef.current = true
          await sendDirectMessage(sb, uid, dmPeer.user_id, body)
        }
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Invio GIF non riuscito')
      }
    },
    [sb, uid, gifTarget, dmPeer],
  )

  const incomingPendingCount = useMemo(
    () => (uid ? requests.filter((r) => r.to_user === uid && r.status === 'pending').length : 0),
    [requests, uid],
  )

  const friendsShown = useMemo(() => {
    if (!uid) return friendships
    const q = friendFilter.trim().toLowerCase()
    if (!q) return friendships
    return friendships.filter((f) => {
      const oid = otherFriendId(f, uid)
      const name = (profileMap.get(oid)?.display_name ?? '').toLowerCase()
      return name.includes(q)
    })
  }, [friendships, friendFilter, uid, profileMap])

  const browseProfileHandle = useMemo(
    () => communityHandleFromDisplayName(myProfile?.display_name ?? ''),
    [myProfile?.display_name],
  )

  const goToCommunityProfile = useCallback(
    (userId: string) => {
      if (!uid) return
      setProfileEditing(false)
      setViewingProfileUserId(userId === uid ? null : userId)
      setTab('profile')
      if (userId !== uid && sb) {
        void fetchCommunityProfiles(sb, [userId]).then((m) => {
          setProfileMap((prev) => new Map([...prev, ...m]))
        })
      }
    },
    [uid, sb],
  )

  const viewedOtherProfile =
    viewingProfileUserId && uid && viewingProfileUserId !== uid ?
      profileMap.get(viewingProfileUserId)
    : undefined

  const isFriendWith = useCallback(
    (otherId: string) => {
      if (!uid) return false
      return friendships.some((f) => otherFriendId(f, uid) === otherId)
    },
    [friendships, uid],
  )

  const loadProfileGallery = useCallback(
    async (forUserId: string, signal?: AbortSignal) => {
      if (!sb) return
      const [photos, rows] = await Promise.all([
        listCommunityProfilePhotos(sb, forUserId),
        listFriendshipsInvolvingUser(sb, forUserId),
      ])
      if (signal?.aborted) return
      setProfileGalleryPhotos(photos)
      const friendIds = rows.map((r) => otherFriendId(r, forUserId))
      if (friendIds.length === 0) {
        setProfileGalleryFriends([])
        return
      }
      const pmap = await fetchCommunityProfiles(sb, friendIds)
      if (signal?.aborted) return
      setProfileGalleryFriends(friendIds.map((id) => pmap.get(id)).filter((p): p is CommunityProfile => Boolean(p)))
    },
    [sb],
  )

  const onPublishProfilePhoto = useCallback(async () => {
    if (!sb || !uid) return
    setGalleryMutating(true)
    try {
      await addCommunityProfilePhoto(sb, uid, newProfilePhotoUrl)
      setNewProfilePhotoUrl('')
      await loadProfileGallery(uid)
    } catch (e) {
      alert(e instanceof Error ? e.message : readSupabaseClientMessage(e))
    } finally {
      setGalleryMutating(false)
    }
  }, [sb, uid, newProfilePhotoUrl, loadProfileGallery])

  const onDeleteProfilePhoto = useCallback(
    async (photoId: string) => {
      if (!sb || !uid) return
      setGalleryMutating(true)
      try {
        await deleteCommunityProfilePhoto(sb, uid, photoId)
        await loadProfileGallery(uid)
      } catch (e) {
        alert(e instanceof Error ? e.message : readSupabaseClientMessage(e))
      } finally {
        setGalleryMutating(false)
      }
    },
    [sb, uid, loadProfileGallery],
  )

  useEffect(() => {
    if (!sb || !uid || !canUseDiary || tab !== 'profile') return
    const target = viewingProfileUserId && viewingProfileUserId !== uid ? viewingProfileUserId : uid
    const ac = new AbortController()
    setProfileGalleryLoading(true)
    void loadProfileGallery(target, ac.signal)
      .catch(() => {
        if (!ac.signal.aborted) {
          setProfileGalleryPhotos([])
          setProfileGalleryFriends([])
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setProfileGalleryLoading(false)
      })
    return () => {
      ac.abort()
      setProfileGalleryLoading(false)
    }
  }, [sb, uid, canUseDiary, tab, viewingProfileUserId, loadProfileGallery])

  if (!cloudEnabled) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border-2 border-[#1A1A1A]/20 bg-white/80 p-6 text-center">
        <p className="text-[15px] text-[#374550]">Community non disponibile: configura Supabase nell&apos;ambiente.</p>
      </div>
    )
  }

  if (initializing) {
    return <p className="text-center text-sm font-medium text-gray-600">Caricamento…</p>
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] p-8 text-center shadow-[5px_5px_0px_#1A1A1A]">
        <p className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#162327]">Entra per la community</p>
        <p className="mt-3 text-[15px] leading-relaxed text-[#374550]">
          Chat, amici e messaggi privati sono legati al tuo account cloud. Accedi dall&apos;area personale o dalla
          registrazione.
        </p>
        <button
          type="button"
          onClick={() => onSelectNav('oasi')}
          className="mt-6 rounded-2xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] px-6 py-3 font-bold text-[#162327] shadow-[3px_3px_0px_#1A1A1A]"
        >
          Vai all&apos;area personale
        </button>
      </div>
    )
  }

  /** Chat globale, amici/DM e profilo: larghezza a tutto schermo + intestazione community nascosta. */
  const communityFullBleed = tab === 'profile' || tab === 'chat' || tab === 'friends'

  return (
    <>
      {gifPickerOpen ?
        <CommunityGifPicker key={gifPickerNonce} open onClose={() => setGifPickerOpen(false)} onPick={onGifPicked} />
      : null}
      <div
        className={
          communityFullBleed ?
            'mx-auto flex w-full min-w-0 max-w-none flex-col gap-0 pb-[max(2rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] -mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] md:-mx-8 md:w-[calc(100%+4rem)]'
          : 'mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 pb-[max(3rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] sm:gap-6 md:gap-8 md:pb-10'
        }
      >
        {!communityFullBleed ?
          <header className="rounded-2xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#dcecf2] via-[#faf8f5] to-[#fef6d8] p-4 shadow-[5px_5px_0px_#1A1A1A] sm:rounded-3xl sm:p-6 md:p-8">
            <p className="mb-2 inline-flex rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
              Community
            </p>
            <h1 className="font-['Space_Grotesk',sans-serif] text-xl font-bold tracking-tight text-[#162327] sm:text-2xl md:text-3xl">
              Tra simili ci si capisce, fatti sentire!
            </h1>
            <p className="mt-3 max-w-xl text-[15px] font-medium leading-relaxed text-[#374550]">
              Uno spazio sobrio per scambiare due parole in chat globale, conoscere altre persone che usano Alveo e, con
              amicizia accettata, scriversi in privato. Rispetto e confini: niente spam, niente molestie.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#2d3f46]">
              Online negli ultimi ~90 secondi:{' '}
              <span className="tabular-nums">{onlineCount == null ? '—' : onlineCount}</span>
            </p>
          </header>
        : null}

        <div
          className={
            communityFullBleed ?
              'sticky top-0 z-30 grid w-full min-w-0 grid-cols-3 gap-1.5 border-b-2 border-[#1A1A1A]/12 bg-[#faf8f5]/95 px-0 py-2 backdrop-blur-md sm:gap-2'
            : 'grid w-full min-w-0 grid-cols-3 gap-1.5 sm:gap-2'
          }
          role="tablist"
          aria-label="Sezioni community"
        >
        {tabBtn(tab === 'chat', 'Chat globale', () => setTab('chat'))}
        {tabBtn(tab === 'friends', 'Amici e messaggi', () => setTab('friends'))}
        {tabBtn(
          tab === 'profile',
          'Il tuo profilo',
          () => {
            if (tab === 'profile' && profileEditing) closeProfileEdit()
            else if (tab === 'profile' && viewingProfileUserId) setViewingProfileUserId(null)
            else {
              setViewingProfileUserId(null)
              setTab('profile')
            }
          },
        )}
      </div>

      {tab === 'chat' ?
        <section
          className="flex min-h-[calc(100dvh-8.5rem)] min-w-0 flex-col overflow-hidden rounded-none border-[3px] border-[#1A1A1A] bg-white shadow-[4px_4px_0px_#1A1A1A] sm:min-h-[calc(100dvh-9rem)] md:min-h-[calc(100dvh-9.5rem)]"
          aria-label="Chat globale"
        >
          <div
            ref={globalListRef}
            className="min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-3 pe-4 sm:px-4 sm:py-4 sm:pe-5"
          >
            {globalMessages.length > 0 && globalHasMore ?
              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  disabled={globalLoadingOlder}
                  onClick={() => void loadOlderGlobal()}
                  className="rounded-lg border-2 border-[#1A1A1A]/40 bg-white px-3 py-1.5 text-xs font-bold text-[#374550] shadow-[1px_1px_0px_#1A1A1A] disabled:opacity-50"
                >
                  {globalLoadingOlder ? 'Carico…' : 'Carica messaggi precedenti'}
                </button>
              </div>
            : null}
            {globalBusy && globalMessages.length === 0 ?
              <p className="text-sm text-gray-600">Carico i messaggi…</p>
            : null}
            {globalError ?
              <p className="text-sm font-medium text-red-700">{globalError}</p>
            : null}
            {globalMessages.map((m) => {
              const p = profileMap.get(m.user_id)
              const mine = m.user_id === uid
              const senderLabel =
                mine ?
                  (myProfile?.display_name ?? p?.display_name ?? 'Tu')
                : (p?.display_name ?? 'Utente')
              const senderInitial = (p?.display_name ?? (mine ? myProfile?.display_name : null) ?? '?')
                .slice(0, 1)
                .toUpperCase()
              const avatarUrl = mine ? myProfile?.avatar_url : p?.avatar_url
              return (
                <div
                  key={m.id}
                  className={`flex w-full flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}
                >
                  <button
                    type="button"
                    onClick={() => goToCommunityProfile(m.user_id)}
                    aria-label={`Apri profilo di ${senderLabel}`}
                    className={
                      'flex max-w-[min(85%,calc(100%-0.5rem))] items-center gap-2 rounded-lg px-0.5 py-0.5 text-left transition hover:bg-[#1A1A1A]/6 ' +
                      (mine ? 'flex-row-reverse self-end' : '')
                    }
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1A1A1A]/35 bg-[#eae5df] text-[10px] font-bold text-[#162327]">
                      {avatarUrl ?
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      : senderInitial}
                    </span>
                    <span
                      className={`min-w-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c6b72] ${
                        mine ? 'text-right' : 'text-left'
                      }`}
                    >
                      {senderLabel}
                    </span>
                  </button>
                  <div
                    className={
                      mine ?
                        'max-w-[min(85%,calc(100%-0.5rem))] rounded-2xl border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 text-[14px] text-white'
                      : 'max-w-[min(85%,calc(100%-0.5rem))] rounded-2xl border-2 border-[#1A1A1A]/25 bg-[#f4f0ea] px-3 py-2 text-[14px] text-[#1A1A1A]'
                    }
                  >
                    <CommunityMessageBody body={m.body} mine={mine} />
                    <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                      {new Date(m.created_at).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="shrink-0 border-t-2 border-[#1A1A1A]/12 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <textarea
                value={draftGlobal}
                onChange={(e) => setDraftGlobal(e.target.value)}
                maxLength={COMMUNITY_GLOBAL_BODY_MAX}
                rows={2}
                placeholder="Scrivi qualcosa alla community…"
                className="min-h-[3rem] flex-1 resize-none rounded-xl border-2 border-[#1A1A1A] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A1A1A]/30"
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openGifPicker('global')}
                  className="rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-2.5 text-sm font-bold text-[#162327] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#f4f0ea]"
                >
                  GIF
                </button>
                <button
                  type="button"
                  onClick={() => void onSendGlobal()}
                  className="rounded-xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] px-5 py-2.5 text-sm font-bold text-[#162327] shadow-[2px_2px_0px_#1A1A1A] disabled:opacity-50"
                  disabled={!sanitizeCommunityBody(draftGlobal, COMMUNITY_GLOBAL_BODY_MAX)}
                >
                  Invia
                </button>
              </div>
            </div>
          </div>
        </section>
      : tab === 'friends' ?
        <section
          className="flex min-h-[calc(100dvh-8.5rem)] min-w-0 flex-col overflow-hidden rounded-none border-[3px] border-[#1A1A1A] bg-[#faf8f5] shadow-[4px_4px_0px_#1A1A1A] sm:min-h-[calc(100dvh-9rem)] md:min-h-[calc(100dvh-9.5rem)] md:flex-row"
          aria-label="Amici e messaggi privati"
        >
          <div
            className={
              'flex min-h-0 w-full shrink-0 flex-col border-[#1A1A1A]/18 bg-[#ede8e0] md:max-w-[min(100%,22rem)] md:border-r-2 ' +
              (friendsMobileThread && dmPeer ? 'max-md:hidden' : 'max-md:min-h-0 max-md:flex-1')
            }
          >
            <div className="shrink-0 border-b border-[#1A1A1A]/12 px-3 py-3 sm:px-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-['Space_Grotesk',sans-serif] text-lg font-bold tracking-tight text-[#162327]">
                  Messaggi
                </p>
                {friendsBusy ?
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Aggiorno…</span>
                : null}
              </div>
              {incomingPendingCount > 0 ?
                <p className="mt-1.5 text-xs font-semibold text-[#2d4a5c]">
                  {incomingPendingCount} richiesta{incomingPendingCount === 1 ? '' : 'e'} in arrivo
                </p>
              : null}
              <label className="sr-only" htmlFor="friend-filter">
                Filtra conversazioni
              </label>
              <input
                id="friend-filter"
                value={friendFilter}
                onChange={(e) => setFriendFilter(e.target.value)}
                className="mt-2.5 w-full rounded-full border border-[#1A1A1A]/25 bg-white px-3.5 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-[#1A1A1A]/55"
                placeholder="Cerca…"
                type="search"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 sm:px-4">
                Amici
              </p>
              <ul className="divide-y divide-[#1A1A1A]/8">
                {friendsShown.length === 0 ?
                  <li className="px-3 py-6 text-center text-sm text-gray-600 sm:px-4">
                    {friendFilter.trim() ?
                      'Nessun amico con questo nome.'
                    : 'Nessun amico ancora. Trova persone in basso.'}
                  </li>
                : friendsShown.map((f) => {
                    const oid = otherFriendId(f, uid!)
                    const pr = profileMap.get(oid)
                    const active = dmPeer?.user_id === oid
                    const preview = dmPreviewByPeer.get(oid)
                    return (
                      <li
                        key={`${f.user_a}-${f.user_b}`}
                        className={`flex w-full items-stretch ${active ? 'bg-[#dce8ee]/90' : ''}`}
                      >
                        <button
                          type="button"
                          aria-label={`Profilo di ${pr?.display_name ?? 'Utente'}`}
                          className="flex shrink-0 items-center px-3 py-2.5 transition hover:bg-white/50 sm:px-4"
                          onClick={() => goToCommunityProfile(oid)}
                        >
                          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#1A1A1A] bg-[#eae5df] text-sm font-bold text-[#162327]">
                            {pr?.avatar_url ?
                              <img src={pr.avatar_url} alt="" className="h-full w-full object-cover" />
                            : (pr?.display_name ?? '?').slice(0, 1).toUpperCase()}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDmWithFriend(oid)}
                          className={
                            'min-w-0 flex-1 py-2.5 pr-3 text-left transition sm:pr-4 ' +
                            (active ? '' : 'hover:bg-white/40')
                          }
                        >
                          <span className="block truncate font-semibold text-[#162327]">
                            {pr?.display_name ?? 'Utente'}
                          </span>
                          {preview ?
                            <span className="mt-0.5 block truncate text-xs text-gray-600">{preview}</span>
                          : (
                            <span className="mt-0.5 block truncate text-xs text-gray-400">Messaggi privati</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
              </ul>

              <div className="border-t border-[#1A1A1A]/10 px-3 py-3 sm:px-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">Richieste</p>
                {requests.filter((r) => r.to_user === uid && r.status === 'pending').length === 0 &&
                requests.filter((r) => r.from_user === uid && r.status === 'pending').length === 0 ?
                  <p className="mt-2 text-xs text-gray-500">Nessuna richiesta in sospeso.</p>
                : (
                  <ul className="mt-2 space-y-2">
                    {requests
                      .filter((r) => r.to_user === uid && r.status === 'pending')
                      .map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1A1A1A]/20 bg-white/90 px-2.5 py-2"
                        >
                          <span className="min-w-0 truncate text-xs">
                            <button
                              type="button"
                              className="font-semibold text-[#162327] hover:underline"
                              onClick={() => goToCommunityProfile(r.from_user)}
                            >
                              {profileMap.get(r.from_user)?.display_name ?? 'Qualcuno'}
                            </button>
                            <span className="text-gray-500"> vuole connettersi</span>
                          </span>
                          <span className="flex shrink-0 gap-1.5">
                            <button
                              type="button"
                              className="rounded-lg border-2 border-[#1A1A1A] bg-[#D8CDE6] px-2 py-1 text-[10px] font-bold"
                              onClick={() => void onAccept(r.id)}
                            >
                              Accetta
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-[#1A1A1A]/35 px-2 py-1 text-[10px] font-bold text-gray-600"
                              onClick={() => void onReject(r.id)}
                            >
                              Rifiuta
                            </button>
                          </span>
                        </li>
                      ))}
                    {requests
                      .filter((r) => r.from_user === uid && r.status === 'pending')
                      .map((r) => (
                        <li
                          key={r.id}
                          className="rounded-xl border border-dashed border-[#1A1A1A]/25 bg-white/50 px-2.5 py-1.5 text-xs text-gray-600"
                        >
                          In attesa verso <strong>{profileMap.get(r.to_user)?.display_name ?? '…'}</strong>
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-[#1A1A1A]/10">
                <button
                  type="button"
                  onClick={() => setFindPeopleOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left sm:px-4"
                  aria-expanded={findPeopleOpen}
                >
                  <span className="text-sm font-bold text-[#162327]">Trova persone</span>
                  <span className="text-xs text-gray-500">{findPeopleOpen ? '▼' : '▶'}</span>
                </button>
                {findPeopleOpen ?
                  <div className="space-y-2 border-t border-[#1A1A1A]/8 px-3 pb-4 pt-2 sm:px-4">
                    <p className="text-[11px] text-gray-500">Almeno 2 caratteri, poi richiesta di amicizia.</p>
                    <div className="flex gap-2">
                      <input
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        className="min-w-0 flex-1 rounded-full border border-[#1A1A1A]/25 bg-white px-3 py-2 text-sm"
                        placeholder="Nome…"
                      />
                      <button
                        type="button"
                        onClick={() => void onSearchUsers()}
                        className="shrink-0 rounded-full border-[3px] border-[#1A1A1A] bg-[#f9e784] px-3 py-2 text-xs font-bold shadow-[2px_2px_0px_#1A1A1A]"
                      >
                        Cerca
                      </button>
                    </div>
                    <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                      {searchHits.map((h) => (
                        <li
                          key={h.user_id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#1A1A1A]/12 bg-white px-2 py-1.5"
                        >
                          <button
                            type="button"
                            className="min-w-0 truncate text-left text-sm font-medium hover:underline"
                            onClick={() => goToCommunityProfile(h.user_id)}
                          >
                            {h.display_name}
                          </button>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border-2 border-[#1A1A1A] bg-[#faf8f5] px-2 py-1 text-[10px] font-bold"
                            onClick={() => void onRequestFriend(h.user_id)}
                          >
                            Richiedi
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                : null}
              </div>
            </div>
          </div>

          <div
            className={
              'flex min-h-0 min-w-0 flex-1 flex-col bg-[#faf8f5] ' +
              (friendsMobileThread && dmPeer ? 'max-md:flex max-md:flex-1' : 'max-md:hidden') +
              ' md:flex'
            }
          >
            <header className="flex shrink-0 items-center gap-2 border-b border-[#1A1A1A]/12 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
              <button
                type="button"
                className="rounded-lg border-2 border-transparent p-2 text-[#162327] hover:bg-white/80 md:hidden"
                onClick={() => setFriendsMobileThread(false)}
                aria-label="Torna alla lista"
              >
                ←
              </button>
              {dmPeer ?
                <button
                  type="button"
                  onClick={() => goToCommunityProfile(dmPeer.user_id)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-xl py-1 text-left transition hover:bg-[#1A1A1A]/6 sm:gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1A1A1A] bg-[#eae5df] text-xs font-bold sm:h-10 sm:w-10">
                    {dmPeer.avatar_url ?
                      <img src={dmPeer.avatar_url} alt="" className="h-full w-full object-cover" />
                    : (dmPeer.display_name || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-['Space_Grotesk',sans-serif] text-base font-bold text-[#162327]">
                      {dmPeer.display_name}
                    </p>
                    <p className="text-[11px] text-gray-500">Messaggi privati</p>
                  </div>
                </button>
              : (
                <p className="flex-1 py-1 text-sm text-gray-500">Seleziona una conversazione</p>
              )}
            </header>

            <div
              ref={dmListRef}
              className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4"
            >
              {!dmPeer ?
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
                  <p>Scegli un amico dalla lista per iniziare.</p>
                </div>
              : null}
              {dmPeer && dmRows.length > 0 && dmHasMore ?
                <div className="flex justify-center pb-1">
                  <button
                    type="button"
                    disabled={dmLoadingOlder}
                    onClick={() => void loadOlderDm()}
                    className="rounded-full border-2 border-[#1A1A1A]/30 bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                  >
                    {dmLoadingOlder ? 'Carico…' : 'Messaggi precedenti'}
                  </button>
                </div>
              : null}
              {dmPeer ?
                dmRows.map((m) => {
                  const mine = m.sender_id === uid
                  const peerInitial = (dmPeer.display_name || '?').slice(0, 1).toUpperCase()
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start gap-2'}`}>
                      {!mine ?
                        <button
                          type="button"
                          aria-label={`Profilo di ${dmPeer.display_name}`}
                          onClick={() => goToCommunityProfile(dmPeer.user_id)}
                          className="mt-auto flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#1A1A1A]/40 bg-[#eae5df] text-[10px] font-bold transition hover:ring-2 hover:ring-[#1A1A1A]/25"
                        >
                          {dmPeer.avatar_url ?
                            <img src={dmPeer.avatar_url} alt="" className="h-full w-full object-cover" />
                          : peerInitial}
                        </button>
                      : null}
                      <div
                        className={
                          mine ?
                            'max-w-[min(88%,20rem)] rounded-2xl rounded-br-md border border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 text-sm text-white'
                          : 'max-w-[min(88%,20rem)] rounded-2xl rounded-bl-md border border-[#1A1A1A]/15 bg-white px-3 py-2 text-sm text-[#162327] shadow-sm'
                        }
                      >
                        <CommunityMessageBody body={m.body} mine={mine} />
                      </div>
                    </div>
                  )
                })
              : null}
            </div>

            <div className="shrink-0 border-t border-[#1A1A1A]/12 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <textarea
                  value={draftDm}
                  onChange={(e) => setDraftDm(e.target.value)}
                  disabled={!dmPeer}
                  maxLength={COMMUNITY_DM_BODY_MAX}
                  rows={2}
                  placeholder={dmPeer ? 'Scrivi un messaggio…' : 'Scegli un amico'}
                  className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border-2 border-[#1A1A1A]/28 bg-white px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]/55 disabled:opacity-45"
                />
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={!dmPeer}
                    onClick={() => openGifPicker('dm')}
                    className="rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-2.5 text-sm font-bold shadow-[2px_2px_0px_#1A1A1A] disabled:opacity-40"
                  >
                    GIF
                  </button>
                  <button
                    type="button"
                    disabled={!dmPeer || !sanitizeCommunityBody(draftDm, COMMUNITY_DM_BODY_MAX)}
                    onClick={() => void onSendDm()}
                    className="rounded-xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] px-5 py-2.5 text-sm font-bold text-[#162327] shadow-[2px_2px_0px_#1A1A1A] disabled:opacity-40"
                  >
                    Invia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      : tab === 'profile' && viewingProfileUserId && uid && viewingProfileUserId !== uid ?
        <div className="flex min-h-[min(100dvh,56rem)] flex-col bg-[#faf8f5] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-6 sm:pt-4">
          <div className="mx-auto flex w-full max-w-md flex-col">
            <button
              type="button"
              onClick={() => setViewingProfileUserId(null)}
              className="mb-5 self-start rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-2 text-sm font-bold text-[#162327] shadow-[2px_2px_0px_#1A1A1A]"
            >
              Indietro
            </button>
            {!viewedOtherProfile ?
              <p className="text-center text-sm font-medium text-gray-600">Caricamento profilo…</p>
            : (
              <>
                <div
                  className="relative h-32 shrink-0 rounded-2xl bg-gradient-to-br from-[#c9dce6] via-[#e8e0f0] to-[#fef6d8] sm:h-36"
                  aria-hidden
                />
                <div className="relative -mt-12 flex flex-col items-center px-2 text-center sm:-mt-14">
                  <div className="flex h-[6.5rem] w-[6.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full border-[4px] border-white bg-[#eae5df] font-['Space_Grotesk',sans-serif] text-3xl font-bold text-[#162327] shadow-[0_5px_0_#1A1A1A] ring-2 ring-[#1A1A1A]/10">
                    {viewedOtherProfile.avatar_url ?
                      <img src={viewedOtherProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                    : (viewedOtherProfile.display_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <h2 className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#162327] sm:text-2xl">
                    {viewedOtherProfile.display_name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#5c6b72]">
                    @{communityHandleFromDisplayName(viewedOtherProfile.display_name)}
                  </p>
                  <p className="mt-4 text-[13px] leading-relaxed text-[#374550]">
                    Profilo pubblico in community: nome e foto come in chat e nei messaggi.
                  </p>
                  <div className="mt-6 grid w-full max-w-sm grid-cols-2 divide-x divide-[#1A1A1A]/12 border-y border-[#1A1A1A]/12 py-4">
                    <div>
                      <p className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-[#162327]">
                        {profileGalleryLoading ? '—' : profileGalleryFriends.length}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6b72]">Amici</p>
                    </div>
                    <div>
                      <p className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-[#162327]">
                        {profileGalleryLoading ? '—' : profileGalleryPhotos.length}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6b72]">Foto</p>
                    </div>
                  </div>
                  <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
                    {isFriendWith(viewingProfileUserId) ?
                      <button
                        type="button"
                        onClick={() => {
                          const id = viewingProfileUserId
                          setViewingProfileUserId(null)
                          setTab('friends')
                          openDmWithFriend(id)
                        }}
                        className="w-full rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] py-3 text-sm font-bold text-white shadow-[4px_4px_0px_#f9e784]"
                      >
                        Messaggio privato
                      </button>
                    : (
                      <button
                        type="button"
                        onClick={() => void onRequestFriend(viewingProfileUserId)}
                        className="w-full rounded-2xl border-[3px] border-[#1A1A1A] bg-[#f9e784] py-3 text-sm font-bold text-[#162327] shadow-[4px_4px_0px_#1A1A1A]"
                      >
                        Richiedi amicizia
                      </button>
                    )}
                  </div>
                  <div className="mt-10 w-full max-w-md self-stretch">
                    <ProfileFriendsAndGallery
                      friends={profileGalleryFriends}
                      photos={profileGalleryPhotos}
                      loading={profileGalleryLoading}
                      isOwn={false}
                      onOpenProfile={goToCommunityProfile}
                      newPhotoUrl=""
                      onNewPhotoUrlChange={() => {}}
                      onPublishPhoto={() => {}}
                      onDeletePhoto={() => {}}
                      mutating={false}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      : profileEditing ?
        <div className="flex min-h-[min(calc(100dvh-6rem),56rem)] w-full flex-col bg-[#faf8f5] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-6 sm:pt-4">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#1A1A1A]/12 pb-5">
              <div className="min-w-0 flex-1">
                <h2 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#162327] sm:text-2xl">
                  Modifica profilo
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#374550]">
                  Per la foto incolla l&apos;URL di un&apos;immagine HTTPS già online; in seguito potrai caricare un file.
                </p>
              </div>
              <button
                type="button"
                onClick={closeProfileEdit}
                className="shrink-0 rounded-xl border-[3px] border-[#1A1A1A] bg-white px-4 py-2 text-sm font-bold text-[#162327] shadow-[2px_2px_0px_#1A1A1A] transition hover:bg-[#f4f0ea]"
              >
                Chiudi
              </button>
            </header>
            <label className="block text-sm font-bold text-[#162327]">
              Nome visibile
              <input
                value={profileNameDraft}
                onChange={(e) => setProfileNameDraft(e.target.value)}
                maxLength={80}
                className="mt-1 w-full rounded-xl border-2 border-[#1A1A1A] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="mt-4 block text-sm font-bold text-[#162327]">
              URL foto profilo (opzionale)
              <input
                value={profileAvatarDraft}
                onChange={(e) => setProfileAvatarDraft(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-[#1A1A1A] px-3 py-2.5 text-sm"
                placeholder="https://…"
              />
            </label>
            <button
              type="button"
              disabled={profileSaving}
              onClick={() => void onSaveProfile()}
              className="mt-10 w-full rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] py-3.5 text-sm font-bold text-white shadow-[4px_4px_0px_#f9e784] disabled:opacity-50"
            >
              {profileSaving ? 'Salvataggio…' : 'Salva profilo'}
            </button>
          </div>
        </div>
      : (
          <div className="flex min-h-[min(100dvh,56rem)] flex-col bg-[#faf8f5]">
            <div
              className="relative h-40 shrink-0 bg-gradient-to-br from-[#c9dce6] via-[#e8e0f0] to-[#fef6d8] sm:h-48"
              aria-hidden
            />
            <div className="relative -mt-[4.5rem] flex flex-1 flex-col px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:-mt-[5rem] sm:px-6">
              <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
                <div className="flex h-[7.25rem] w-[7.25rem] shrink-0 items-center justify-center overflow-hidden rounded-full border-[4px] border-white bg-[#eae5df] font-['Space_Grotesk',sans-serif] text-4xl font-bold text-[#162327] shadow-[0_6px_0_#1A1A1A] ring-2 ring-[#1A1A1A]/10">
                  {myProfile?.avatar_url ?
                    <img src={myProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                  : (
                    (myProfile?.display_name || '?').slice(0, 1).toUpperCase()
                  )}
                </div>
                <h2 className="mt-4 font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] sm:text-[1.75rem]">
                  {myProfile?.display_name || 'Profilo'}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#5c6b72]">@{browseProfileHandle}</p>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[#374550]">
                  Questo è come ti presenti in community. Nome e immagine compaiono in chat e nei messaggi.
                </p>

                <div className="mt-6 grid w-full max-w-sm grid-cols-3 divide-x divide-[#1A1A1A]/12 border-y border-[#1A1A1A]/12 py-4">
                  <div>
                    <p className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-[#162327]">
                      {profileGalleryLoading ? '—' : profileGalleryFriends.length}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6b72]">Amici</p>
                  </div>
                  <div>
                    <p className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-[#162327]">
                      {profileGalleryLoading ? '—' : profileGalleryPhotos.length}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6b72]">Foto</p>
                  </div>
                  <div>
                    <p className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-[#162327]">
                      {incomingPendingCount}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6b72]">In attesa</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileEditing(true)}
                  className="mt-8 w-full max-w-sm rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3.5 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-[4px_4px_0px_#f9e784] transition hover:bg-[#2a383f] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0px_#f9e784]"
                >
                  Modifica profilo
                </button>
              </div>

              <div className="mx-auto w-full max-w-md">
                <ProfileFriendsAndGallery
                  friends={profileGalleryFriends}
                  photos={profileGalleryPhotos}
                  loading={profileGalleryLoading}
                  isOwn
                  onOpenProfile={goToCommunityProfile}
                  newPhotoUrl={newProfilePhotoUrl}
                  onNewPhotoUrlChange={setNewProfilePhotoUrl}
                  onPublishPhoto={() => void onPublishProfilePhoto()}
                  onDeletePhoto={(id) => void onDeleteProfilePhoto(id)}
                  mutating={galleryMutating}
                />
              </div>
            </div>
          </div>
        )
      }
      </div>
    </>
  )
}
