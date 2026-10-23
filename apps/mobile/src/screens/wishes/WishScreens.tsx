import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { fetchQuery, useApiQuery } from '../../api/queryStore';
import { errorMessage, ApiError } from '../../api/client';
import { fetchMyGroups, MY_GROUPS_KEY, type GroupSummary } from '../../api/groups';
import * as wishApi from '../../api/wishes';
import { commentsKey, myWishlistKey, type ApiWish } from '../../api/wishes';
import { fetchGroupBundle, groupKey } from '../../api/groupDetail';
import { sortGroups } from '../../utils/groupLabels';
import { GroupState, useGroupDetail } from '../group/GroupScreens';
import MyWishesScreen from './MyWishesScreen';
import WishFormScreen from './WishFormScreen';
import WishDetailScreen from '../wish/WishDetailScreen';
import type { DashboardTab } from '../../components/common/FloatingTabBar';
import type { MyWish, MyWishlistGroup, WishCategory, WishComment, WishDetailView, WishPreview } from '../../types/session';

/**
 * Contenedores de la lista de deseos conectados a la API:
 * Deseos (mi lista y la de mi pana), agregar/editar deseo y detalle con comentarios anónimos.
 */

const CATEGORIES: WishCategory[] = ['ropa', 'tecnologia', 'hogar', 'libros', 'dulces', 'otro'];
const DEFAULT_MAX_WISHES = 20;
const isRemote = (uri?: string | null) => !!uri && /^https?:\/\//i.test(uri);

export function toMyWish(w: ApiWish, fallbackCurrency: 'USD' | 'VES'): MyWish {
  return {
    id: w.id,
    title: w.title,
    subtitle: w.description || null,
    price: w.estimatedPrice,
    currency: w.currency ?? fallbackCurrency,
    category: CATEGORIES.includes(w.category as WishCategory) ? (w.category as WishCategory) : 'otro',
    imageUrl: w.imageUrl ?? null,
    priority: w.isFavorite ? 'alta' : 'normal',
    store: w.storeName ? { name: w.storeName } : null,
    url: w.productUrl ?? null,
    note: null,
    commentsCount: w.commentsCount ?? 0,
    unansweredCount: w.unansweredCount ?? 0,
    comments: [],
  };
}

function toInput(wish: MyWish, previous: MyWish | null): wishApi.WishInput {
  return {
    title: wish.title,
    description: wish.subtitle || null,
    estimatedPrice: wish.price,
    currency: wish.currency,
    category: wish.category,
    storeName: wish.store?.name || null,
    productUrl: wish.url || null,
    isFavorite: wish.priority === 'alta',
    // Solo se sube si es una foto nueva del teléfono
    localImageUri: wish.imageUrl && !isRemote(wish.imageUrl) && wish.imageUrl !== previous?.imageUrl ? wish.imageUrl : null,
  };
}

const useMyGroups = () => useApiQuery(MY_GROUPS_KEY, fetchMyGroups, { staleMs: 30_000 });

function useMyWishlist(groupId: string) {
  const fetcher = useCallback(() => wishApi.fetchMyWishlist(groupId), [groupId]);
  return useApiQuery(myWishlistKey(groupId), fetcher, { enabled: Boolean(groupId) });
}

/** Recarga la lista, el inicio y (si existe) el detalle del grupo */
async function refreshWishes(groupId: string) {
  await Promise.all([
    fetchQuery(myWishlistKey(groupId), () => wishApi.fetchMyWishlist(groupId)),
    fetchQuery(MY_GROUPS_KEY, fetchMyGroups),
  ]);
}

/* ==================================================================== Deseos */

interface MyWishesProps {
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onOpenWish: (groupId: string, wishId: string, viewer: 'owner' | 'giver') => void;
  onAddWish: (groupId: string) => void;
  onEditWish: (groupId: string, wishId: string) => void;
  onOpenEnvelope: (groupId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onProfilePress: () => void;
  onOpenNotifications: () => void;
  hasNotifications?: boolean;
  chatUnread?: number;
}

export function MyWishesContainer({ selectedGroupId, onSelectGroup, onOpenWish, onAddWish, onEditWish, ...nav }: MyWishesProps) {
  const groups = useMyGroups();
  const ordered = useMemo(() => sortGroups(groups.data ?? []), [groups.data]);
  const current: GroupSummary | undefined = ordered.find((g) => g.id === selectedGroupId) ?? ordered.find((g) => g.status !== 'COMPLETED') ?? ordered[0];
  const groupId = current?.id ?? '';
  const wishes = useMyWishlist(groupId);
  const detail = useGroupDetail(current && current.status !== 'WAITING' ? groupId : '');
  const [pulling, setPulling] = useState(false);

  const lists: MyWishlistGroup[] = ordered.map((g) => ({
    groupId: g.id,
    emoji: g.emoji || '🎁',
    name: g.name,
    status: g.status,
    currency: g.currency,
    budgetMax: g.budgetMax,
    maxWishes: g.id === groupId ? (wishes.data?.max ?? DEFAULT_MAX_WISHES) : DEFAULT_MAX_WISHES,
    exchangeYear: new Date(g.exchangeDate).getFullYear(),
    wishes: g.id === groupId ? (wishes.data?.results ?? []).map((w) => toMyWish(w, g.currency)) : [],
  }));

  const run = async (task: () => Promise<unknown>) => {
    try {
      await task();
      await refreshWishes(groupId);
    } catch (e) {
      Alert.alert('No se pudo completar', errorMessage(e));
    }
  };

  return (
    <MyWishesScreen
      {...nav}
      lists={lists}
      selectedGroupId={groupId}
      onSelectGroup={onSelectGroup}
      loadingGroups={groups.loading}
      loadingWishes={wishes.loading}
      wishesError={wishes.error && !wishes.data ? wishes.error.message : null}
      onRetry={() => void wishes.refetch()}
      refreshing={pulling}
      onRefresh={() => {
        setPulling(true);
        void Promise.all([groups.refetch(), wishes.refetch(), detail.view ? detail.refetch() : null]).finally(() => setPulling(false));
      }}
      onTogglePriority={(gid, wish) => void run(() => wishApi.setWishFavorite(gid, wish.id, wish.priority !== 'alta'))}
      onDeleteWish={(gid, wish) => void run(() => wishApi.deleteWish(gid, wish.id))}
      onOpenWish={(gid, wish) => onOpenWish(gid, wish.id, 'owner')}
      onAddWish={onAddWish}
      onEditWish={(gid, wish) => onEditWish(gid, wish.id)}
      envelopes={detail.view ? { [groupId]: { envelope: detail.view.envelope, opened: !!detail.view.envelopeOpened } } : {}}
      onOpenPanaWish={(gid, wish: WishPreview) => onOpenWish(gid, wish.id, 'giver')}
    />
  );
}

/* ==================================================================== Formulario */

interface FormProps {
  groupId: string;
  wishId: string | null;
  onDone: () => void;
  onCancel: () => void;
}

export function WishFormContainer({ groupId, wishId, onDone, onCancel }: FormProps) {
  const groups = useMyGroups();
  const wishes = useMyWishlist(groupId);
  const group = groups.data?.find((g) => g.id === groupId);
  const apiWish = wishId ? wishes.data?.results.find((w) => w.id === wishId) : null;

  if (!group || (wishId && !apiWish)) {
    const failed = (groups.error && !groups.data) || (wishes.error && !wishes.data) || (wishId && wishes.data && !apiWish);
    return (
      <GroupState
        title={wishId ? 'Editar deseo' : 'Agregar deseo'}
        loading={!failed}
        message={wishId && wishes.data && !apiWish ? 'Este deseo ya no existe.' : (groups.error ?? wishes.error)?.message}
        onBack={onCancel}
      />
    );
  }
  const initial = apiWish ? toMyWish(apiWish, group.currency) : null;

  const save = async (wish: MyWish) => {
    try {
      const input = toInput(wish, initial);
      if (initial) await wishApi.updateWish(groupId, initial.id, input);
      else await wishApi.createWish(groupId, input);
      await refreshWishes(groupId);
      onDone();
    } catch (e) {
      const message =
        e instanceof ApiError && e.code === 'WISHLIST_FULL'
          ? e.message
          : e instanceof ApiError && e.code === 'FILE_TOO_LARGE'
            ? 'La foto pesa demasiado (máximo 8 MB). Prueba con otra.'
            : errorMessage(e);
      Alert.alert('No pudimos guardar tu deseo', message);
    }
  };

  return (
    <WishFormScreen
      key={`${groupId}-${wishId ?? 'nuevo'}`}
      group={{
        groupId: group.id,
        emoji: group.emoji || '🎁',
        name: group.name,
        currency: group.currency,
        budgetMax: group.budgetMax,
        year: new Date(group.exchangeDate).getFullYear(),
      }}
      initial={initial}
      onSave={save}
      onCancel={onCancel}
    />
  );
}

/* ==================================================================== Detalle del deseo */

interface DetailProps {
  groupId: string;
  wishId: string;
  viewer: 'owner' | 'giver';
  onNavigateBack: () => void;
  onEdit: () => void;
  /** El deseo se eliminó */
  onDeleted: () => void;
}

const toComment = (c: wishApi.ApiComment): WishComment => ({ id: c.id, author: c.author, text: c.text, createdAt: c.createdAt });

export function WishDetailContainer({ groupId, wishId, viewer, onNavigateBack, onEdit, onDeleted }: DetailProps) {
  const groups = useMyGroups();
  const mine = useMyWishlist(viewer === 'owner' ? groupId : '');
  const pana = useGroupDetail(viewer === 'giver' ? groupId : '');
  const commentsFetcher = useCallback(() => wishApi.fetchComments(groupId, wishId), [groupId, wishId]);
  const comments = useApiQuery(commentsKey(wishId), commentsFetcher);

  const summary = groups.data?.find((g) => g.id === groupId);
  const currency = summary?.currency ?? pana.bundle?.group.currency ?? 'USD';
  const apiWish: ApiWish | undefined =
    viewer === 'owner'
      ? mine.data?.results.find((w) => w.id === wishId)
      : (pana.bundle?.assignedWishes.find((w) => w.id === wishId) as ApiWish | undefined);

  if (!apiWish) {
    const source = viewer === 'owner' ? mine : pana;
    const loaded = viewer === 'owner' ? !!mine.data : !!pana.bundle;
    return (
      <GroupState
        title={viewer === 'owner' ? 'Mi deseo' : 'Deseo de tu pana'}
        loading={!loaded && !source.error}
        message={loaded ? 'Este deseo ya no existe.' : source.error?.message}
        onRetry={loaded ? undefined : () => void source.refetch()}
        onBack={onNavigateBack}
      />
    );
  }

  const base = toMyWish(apiWish, currency);
  const ownerAlias =
    viewer === 'giver'
      ? pana.bundle?.assignment?.receiver.alias ?? 'tu pana'
      : summary?.myAlias ?? 'Tú';
  const view: WishDetailView = {
    ...base,
    viewer,
    groupName: summary?.name ?? pana.bundle?.group.name ?? '',
    ownerAlias,
    comments: [],
  };

  // Antes del sorteo el backend responde 409: el hilo aún no existe
  const notOpenYet = comments.error instanceof ApiError && comments.error.code === 'NOT_DRAWN_YET';
  const canComment = comments.data ? comments.data.canComment : false;
  const closedReason = notOpenYet
    ? 'Los comentarios se abren cuando se haga el sorteo.'
    : comments.data && !comments.data.canComment
      ? 'El intercambio finalizó: los comentarios están cerrados.'
      : comments.error
        ? comments.error.message
        : null;

  return (
    <View style={{ flex: 1 }}>
      <WishDetailScreen
        key={`${viewer}-${wishId}`}
        wish={view}
        comments={(comments.data?.results ?? []).map(toComment)}
        commentsLoading={comments.loading}
        canComment={canComment}
        closedReason={closedReason}
        onNavigateBack={onNavigateBack}
        onSend={async (text) => {
          await wishApi.postComment(groupId, wishId, text);
          await Promise.all([
            comments.refetch(),
            viewer === 'owner'
              ? fetchQuery(myWishlistKey(groupId), () => wishApi.fetchMyWishlist(groupId))
              : fetchQuery(groupKey(groupId), () => fetchGroupBundle(groupId)),
          ]);
        }}
        onEdit={viewer === 'owner' ? onEdit : undefined}
        onDelete={
          viewer === 'owner'
            ? () =>
                void wishApi
                  .deleteWish(groupId, wishId)
                  .then(() => refreshWishes(groupId))
                  .then(onDeleted)
                  .catch((e: unknown) => Alert.alert('No se pudo eliminar', errorMessage(e)))
            : undefined
        }
      />
    </View>
  );
}
