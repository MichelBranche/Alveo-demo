import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useDiaryAuth } from '../context/DiaryAuthContext'
import { getDiarySupabase } from '../lib/diaryCloud'
import {
  acceptFriendRequestRpc,
  COMMUNITY_DM_BODY_MAX,
  COMMUNITY_GLOBAL_BODY_MAX,
  fetchCommunityProfiles,
  fetchCommunityOnlineCount,
  fetchDirectMessages,
  fetchGlobalMessages,
  fetchMyCommunityProfile,
  listFriendRequests,
  listFriendships,
  otherFriendId,
  rejectFriendRequest,
  sanitizeCommunityBody,
  searchCommunityProfiles,
  sendDirectMessage,
  sendFriendRequest,
  sendGlobalMessage,
  subscribeDirectMessages,
  subscribeGlobalMessages,
  touchCommunityOnline,
  upsertCommunityProfile,
  type CommunityProfile,
  type DirectMessageRow,
  type FriendRequestRow,
  type FriendshipRow,
  type GlobalMessageRow,
} from '../lib/communityCloud'
import type { NavId } from '../nav'

function tabBtn(active: boolean, children: ReactNode, onClick: () => void) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active ?
          'rounded-xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_#ffffff]'
        : 'rounded-xl border-2 border-[#1A1A1A]/30 bg-white px-4 py-2 text-sm font-semibold text-[#374550] transition hover:border-[#1A1A1A]/50'
      }
    >
      {children}
    </button>
  )
}

export default function CommunityPage({ onSelectNav }: { onSelectNav: (id: NavId) => void }) {
  const { cloudEnabled, session, initializing, canUseDiary } = useDiaryAuth()
  const sb = useMemo(() => getDiarySupabase(), [])
  const uid = session?.user?.id ?? null

  const [tab, setTab] = useState<'chat' | 'friends' | 'profile'>('chat')
  const [globalMessages, setGlobalMessages] = useState<GlobalMessageRow[]>([])
  const [profileMap, setProfileMap] = useState<Map<string, CommunityProfile>>(new Map())
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [globalBusy, setGlobalBusy] = useState(false)
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
  const [draftDm, setDraftDm] = useState('')

  const globalListRef = useRef<HTMLDivElement>(null)
  const rtGlobalRef = useRef<RealtimeChannel | null>(null)
  const rtDmRef = useRef<RealtimeChannel | null>(null)
  const hbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      await refreshProfilesForMessages(rows)
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'Errore caricamento chat')
    } finally {
      setGlobalBusy(false)
    }
  }, [sb, refreshProfilesForMessages])

  const mergeProfile = useCallback((p: CommunityProfile) => {
    setProfileMap((prev) => new Map(prev).set(p.user_id, p))
  }, [])

  useEffect(() => {
    if (!sb || !uid || !canUseDiary) return
    void loadGlobal()
    rtGlobalRef.current?.unsubscribe()
    rtGlobalRef.current = subscribeGlobalMessages(sb, (row) => {
      setGlobalMessages((prev) => {
        if (prev.some((x) => x.id === row.id)) return prev
        return [...prev, row]
      })
      void fetchCommunityProfiles(sb, [row.user_id]).then((m) => {
        const p = m.get(row.user_id)
        if (p) mergeProfile(p)
      })
    })
    return () => {
      rtGlobalRef.current?.unsubscribe()
      rtGlobalRef.current = null
    }
  }, [sb, uid, canUseDiary, loadGlobal, mergeProfile])

  useEffect(() => {
    if (!globalListRef.current) return
    globalListRef.current.scrollTop = globalListRef.current.scrollHeight
  }, [globalMessages.length])

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

  useEffect(() => {
    if (!sb || !uid || !canUseDiary || tab !== 'friends') return
    void reloadFriends()
  }, [sb, uid, canUseDiary, tab, reloadFriends])

  useEffect(() => {
    if (!sb || !uid || !dmPeer || !canUseDiary) {
      rtDmRef.current?.unsubscribe()
      rtDmRef.current = null
      return
    }
    void (async () => {
      try {
        const rows = await fetchDirectMessages(sb, uid, dmPeer.user_id)
        setDmRows(rows)
      } catch {
        setDmRows([])
      }
    })()
    rtDmRef.current?.unsubscribe()
    rtDmRef.current = subscribeDirectMessages(sb, uid, dmPeer.user_id, (row) => {
      setDmRows((prev) => (prev.some((x) => x.id === row.id) ? prev : [...prev, row]))
    })
    return () => {
      rtDmRef.current?.unsubscribe()
      rtDmRef.current = null
    }
  }, [sb, uid, dmPeer, canUseDiary])

  const onSendGlobal = useCallback(async () => {
    if (!sb || !uid) return
    const body = sanitizeCommunityBody(draftGlobal, COMMUNITY_GLOBAL_BODY_MAX)
    if (!body) return
    setDraftGlobal('')
    try {
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
      await sendDirectMessage(sb, uid, dmPeer.user_id, body)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Messaggio non inviato (serve amicizia accettata).')
    }
  }, [sb, uid, dmPeer, draftDm])

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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-10">
      <header className="rounded-3xl border-[3px] border-[#1A1A1A] bg-gradient-to-br from-[#dcecf2] via-[#faf8f5] to-[#fef6d8] p-6 shadow-[5px_5px_0px_#1A1A1A] md:p-8">
        <p className="mb-2 inline-flex rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#2a383f] shadow-[2px_2px_0px_#1A1A1A]">
          Community
        </p>
        <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-[#162327] md:text-3xl">
          Tra simili ci capisce, fatti sentire!
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

      <div className="flex flex-wrap gap-2">
        {tabBtn(tab === 'chat', 'Chat globale', () => setTab('chat'))}
        {tabBtn(tab === 'friends', 'Amici e messaggi', () => setTab('friends'))}
        {tabBtn(tab === 'profile', 'Il tuo profilo', () => setTab('profile'))}
      </div>

      {tab === 'chat' ?
        <section
          className="flex min-h-[22rem] flex-col rounded-3xl border-[3px] border-[#1A1A1A] bg-white shadow-[5px_5px_0px_#1A1A1A]"
          aria-label="Chat globale"
        >
          <div ref={globalListRef} className="max-h-[min(52vh,28rem)] flex-1 space-y-3 overflow-y-auto p-4">
            {globalBusy && globalMessages.length === 0 ?
              <p className="text-sm text-gray-600">Carico i messaggi…</p>
            : null}
            {globalError ?
              <p className="text-sm font-medium text-red-700">{globalError}</p>
            : null}
            {globalMessages.map((m) => {
              const p = profileMap.get(m.user_id)
              const label = p?.display_name ?? (m.user_id === uid ? 'Tu' : 'Utente')
              const mine = m.user_id === uid
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      mine ?
                        'max-w-[85%] rounded-2xl border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 text-[14px] text-white'
                      : 'max-w-[85%] rounded-2xl border-2 border-[#1A1A1A]/25 bg-[#f4f0ea] px-3 py-2 text-[14px] text-[#1A1A1A]'
                    }
                  >
                    {!mine ?
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c6b72]">
                        {label}
                      </p>
                    : null}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
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
          <div className="border-t-2 border-[#1A1A1A]/12 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <textarea
                value={draftGlobal}
                onChange={(e) => setDraftGlobal(e.target.value)}
                maxLength={COMMUNITY_GLOBAL_BODY_MAX}
                rows={2}
                placeholder="Scrivi qualcosa alla community…"
                className="min-h-[3rem] flex-1 resize-none rounded-xl border-2 border-[#1A1A1A] bg-[#faf8f5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A1A1A]/30"
              />
              <button
                type="button"
                onClick={() => void onSendGlobal()}
                className="shrink-0 rounded-xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] px-5 py-2.5 text-sm font-bold text-[#162327] shadow-[2px_2px_0px_#1A1A1A] disabled:opacity-50"
                disabled={!sanitizeCommunityBody(draftGlobal, COMMUNITY_GLOBAL_BODY_MAX)}
              >
                Invia
              </button>
            </div>
          </div>
        </section>
      : tab === 'friends' ?
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border-[3px] border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0px_#1A1A1A]">
            <h2 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">Amici</h2>
            {friendsBusy ?
              <p className="mt-2 text-sm text-gray-600">Aggiornamento…</p>
            : null}
            <ul className="mt-3 space-y-2">
              {friendships.length === 0 ?
                <li className="text-sm text-gray-600">Nessun amico ancora. Invia una richiesta qui sotto.</li>
              : friendships.map((f) => {
                  const oid = otherFriendId(f, uid!)
                  const pr = profileMap.get(oid)
                  return (
                    <li key={`${f.user_a}-${f.user_b}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setDmPeer(
                            pr ?? {
                              user_id: oid,
                              display_name: 'Utente',
                              avatar_url: null,
                              updated_at: new Date().toISOString(),
                            },
                          )
                          if (!sb) return
                          void fetchCommunityProfiles(sb, [oid]).then((m) => {
                            const p = m.get(oid)
                            if (p) setDmPeer(p)
                          })
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                          dmPeer?.user_id === oid ?
                            'border-[#1A1A1A] bg-[#dcecf2]'
                          : 'border-transparent hover:bg-[#f4f0ea]'
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1A1A1A] bg-[#eae5df] text-xs">
                          {pr?.avatar_url ?
                            <img src={pr.avatar_url} alt="" className="h-full w-full object-cover" />
                          : (
                            (pr?.display_name ?? '?').slice(0, 1).toUpperCase()
                          )}
                        </span>
                        {pr?.display_name ?? 'Utente'}
                      </button>
                    </li>
                  )
                })}
            </ul>

            <h3 className="mt-6 font-bold text-[#162327]">Richieste in arrivo</h3>
            <ul className="mt-2 space-y-2">
              {requests.filter((r) => r.to_user === uid && r.status === 'pending').length === 0 ?
                <li className="text-sm text-gray-600">Nessuna richiesta in sospeso.</li>
              : requests
                  .filter((r) => r.to_user === uid && r.status === 'pending')
                  .map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#1A1A1A]/15 bg-[#faf8f5] px-3 py-2"
                    >
                      <span className="text-sm">
                        Da{' '}
                        <strong>{profileMap.get(r.from_user)?.display_name ?? 'Qualcuno'}</strong>
                      </span>
                      <span className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border-2 border-[#1A1A1A] bg-white px-2 py-1 text-xs font-bold"
                          onClick={() => void onAccept(r.id)}
                        >
                          Accetta
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border-2 border-[#1A1A1A]/30 px-2 py-1 text-xs font-bold"
                          onClick={() => void onReject(r.id)}
                        >
                          Rifiuta
                        </button>
                      </span>
                    </li>
                  ))}
            </ul>

            <h3 className="mt-6 font-bold text-[#162327]">Inviate (in attesa)</h3>
            <ul className="mt-2 text-sm text-gray-600">
              {requests.filter((r) => r.from_user === uid && r.status === 'pending').length === 0 ?
                <li>Nessuna.</li>
              : requests
                  .filter((r) => r.from_user === uid && r.status === 'pending')
                  .map((r) => (
                    <li key={r.id}>
                      In attesa verso <strong>{profileMap.get(r.to_user)?.display_name ?? '…'}</strong>
                    </li>
                  ))}
            </ul>
          </div>

          <div className="flex min-h-[22rem] flex-col rounded-3xl border-[3px] border-[#1A1A1A] bg-[#faf8f5] shadow-[4px_4px_0px_#1A1A1A]">
            <div className="border-b-2 border-[#1A1A1A]/10 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-600">Messaggi privati</p>
              <p className="font-semibold text-[#162327]">{dmPeer?.display_name ?? 'Scegli un amico'}</p>
            </div>
            <div className="max-h-[min(40vh,20rem)] flex-1 space-y-2 overflow-y-auto p-3">
              {!dmPeer ?
                <p className="text-sm text-gray-600">Seleziona un amico dalla lista a sinistra.</p>
              : dmRows.map((m) => {
                  const mine = m.sender_id === uid
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={
                          mine ?
                            'max-w-[88%] rounded-xl border border-[#1A1A1A] bg-[#1A1A1A] px-2.5 py-1.5 text-sm text-white'
                          : 'max-w-[88%] rounded-xl border border-[#1A1A1A]/20 bg-white px-2.5 py-1.5 text-sm'
                        }
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
            <div className="mt-auto border-t-2 border-[#1A1A1A]/10 p-3">
              <textarea
                value={draftDm}
                onChange={(e) => setDraftDm(e.target.value)}
                disabled={!dmPeer}
                maxLength={COMMUNITY_DM_BODY_MAX}
                rows={2}
                placeholder={dmPeer ? 'Messaggio privato…' : 'Scegli un amico'}
                className="mb-2 w-full resize-none rounded-xl border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm disabled:opacity-50"
              />
              <button
                type="button"
                disabled={!dmPeer || !sanitizeCommunityBody(draftDm, COMMUNITY_DM_BODY_MAX)}
                onClick={() => void onSendDm()}
                className="w-full rounded-xl border-[3px] border-[#1A1A1A] bg-[#D8CDE6] py-2 text-sm font-bold shadow-[2px_2px_0px_#1A1A1A] disabled:opacity-40"
              >
                Invia messaggio
              </button>
            </div>
          </div>

          <div className="md:col-span-2 rounded-3xl border-[3px] border-[#1A1A1A] bg-white p-4 shadow-[4px_4px_0px_#1A1A1A]">
            <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#162327]">Cerca utenti per nome</h3>
            <p className="mt-1 text-xs text-gray-600">Almeno 2 caratteri. Invii una richiesta di amicizia.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="flex-1 rounded-xl border-2 border-[#1A1A1A] px-3 py-2 text-sm"
                placeholder="Nome visibile…"
              />
              <button
                type="button"
                onClick={() => void onSearchUsers()}
                className="rounded-xl border-[3px] border-[#1A1A1A] bg-[#f9e784] px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_#1A1A1A]"
              >
                Cerca
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {searchHits.map((h) => (
                <li
                  key={h.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#1A1A1A]/12 bg-[#faf8f5] px-3 py-2"
                >
                  <span className="font-medium">{h.display_name}</span>
                  <button
                    type="button"
                    className="rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-1 text-xs font-bold"
                    onClick={() => void onRequestFriend(h.user_id)}
                  >
                    Richiedi amicizia
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      : <section className="rounded-3xl border-[3px] border-[#1A1A1A] bg-white p-6 shadow-[5px_5px_0px_#1A1A1A]">
          <h2 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#162327]">Profilo community</h2>
          {myProfile?.avatar_url ?
            <div className="mt-3 flex items-center gap-3">
              <img
                src={profileAvatarDraft.trim() || myProfile.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full border-2 border-[#1A1A1A] object-cover"
              />
              <p className="text-sm text-gray-600">Anteprima foto (salva per applicare un nuovo URL).</p>
            </div>
          : null}
          <p className="mt-2 text-sm text-gray-600">
            Nome visibile in chat e messaggi. Per la foto puoi incollare l&apos;URL di un&apos;immagine (HTTPS) già
            ospitata online; in seguito si potrà caricare un file da qui.
          </p>
          <label className="mt-4 block text-sm font-bold text-[#162327]">
            Nome visibile
            <input
              value={profileNameDraft}
              onChange={(e) => setProfileNameDraft(e.target.value)}
              maxLength={80}
              className="mt-1 w-full rounded-xl border-2 border-[#1A1A1A] px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-4 block text-sm font-bold text-[#162327]">
            URL foto profilo (opzionale)
            <input
              value={profileAvatarDraft}
              onChange={(e) => setProfileAvatarDraft(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-[#1A1A1A] px-3 py-2 text-sm"
              placeholder="https://…"
            />
          </label>
          <button
            type="button"
            disabled={profileSaving}
            onClick={() => void onSaveProfile()}
            className="mt-6 rounded-2xl border-[3px] border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white shadow-[3px_3px_0px_#f9e784] disabled:opacity-50"
          >
            {profileSaving ? 'Salvataggio…' : 'Salva profilo'}
          </button>
        </section>
      }
    </div>
  )
}
