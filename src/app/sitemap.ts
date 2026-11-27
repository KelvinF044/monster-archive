
import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { members } from "@/data/members";
import { isEditorialIndexable } from "@/lib/editorial/metadata";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = "https://www.themonsterarchive.com";

const basePages: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${SITE_URL}/members`,
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/watch`,
    changeFrequency: "weekly",
    priority: 0.9,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Gera o sitemap no momento da requisição,
  // permitindo consultar os dados atuais do Supabase.
  await connection();

  // Perfis são definidos pela lista estática do projeto.
  const memberPages: MetadataRoute.Sitemap = members.map((member) => ({
    url: `${SITE_URL}/members/${encodeURIComponent(member.slug)}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const productionPages: MetadataRoute.Sitemap = isEditorialIndexable
    ? [
        { url: `${SITE_URL}/news`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/schedule`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
        { url: `${SITE_URL}/about/support`, changeFrequency: "monthly", priority: 0.5 },
      ]
    : [];
  const fallbackSitemap = [...basePages, ...productionPages, ...memberPages];

  try {
    const supabase = await createClient();

    // 1. Buscar somente coleções ativas.
    const { data: collectionsData, error: collectionsError } =
      await supabase
        .from("watch_collections")
        .select("id, slug")
        .eq("is_active", true);

    if (collectionsError) {
      console.error(
        "Sitemap: error loading active collections:",
        collectionsError.message
      );

      return fallbackSitemap;
    }

    const collections = collectionsData ?? [];

    const collectionPages: MetadataRoute.Sitemap = collections.map(
      (collection) => ({
        url: `${SITE_URL}/watch/${encodeURIComponent(collection.slug)}`,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );

    // Não consultar relacionamentos se não houver coleções.
    if (collections.length === 0) {
      return [...fallbackSitemap, ...collectionPages];
    }

    const collectionIds = collections.map(
      (collection) => collection.id
    );

    // 2. Buscar os vídeos relacionados às coleções ativas.
    const { data: relationshipsData, error: relationshipsError } =
      await supabase
        .from("watch_video_collections")
        .select("collection_id, video_id")
        .in("collection_id", collectionIds);

    if (relationshipsError) {
      console.error(
        "Sitemap: error loading video relationships:",
        relationshipsError.message
      );

      return [...fallbackSitemap, ...collectionPages];
    }

    const relationships = relationshipsData ?? [];

    const videoIds = [
      ...new Set(relationships.map((item) => item.video_id)),
    ];

    // Não consultar vídeos se não houver relacionamentos.
    if (videoIds.length === 0) {
      return [...fallbackSitemap, ...collectionPages];
    }

    // 3. Buscar somente vídeos publicados.
    const { data: videosData, error: videosError } = await supabase
      .from("watch_videos")
      .select("id, slug")
      .in("id", videoIds)
      .eq("status", "published");

    if (videosError) {
      console.error(
        "Sitemap: error loading published videos:",
        videosError.message
      );

      return [...fallbackSitemap, ...collectionPages];
    }

    const videos = videosData ?? [];

    // 4. Criar mapas para confirmar cada relacionamento.
    const collectionsById = new Map(
      collections.map((collection) => [collection.id, collection])
    );

    const videosById = new Map(
      videos.map((video) => [video.id, video])
    );

    // Evitar URLs duplicadas caso um relacionamento seja repetido.
    const videoPagesByUrl = new Map<
      string,
      MetadataRoute.Sitemap[number]
    >();

    for (const relationship of relationships) {
      const collection = collectionsById.get(
        relationship.collection_id
      );

      const video = videosById.get(relationship.video_id);

      // Não incluir vídeos sem coleção ativa ou não publicados.
      if (!collection || !video) {
        continue;
      }

      const videoUrl =
        `${SITE_URL}/watch/` +
        `${encodeURIComponent(collection.slug)}/` +
        `${encodeURIComponent(video.slug)}`;

      videoPagesByUrl.set(videoUrl, {
        url: videoUrl,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    return [
      ...fallbackSitemap,
      ...collectionPages,
      ...videoPagesByUrl.values(),
    ];
  } catch (error) {
    console.error("Sitemap: unexpected generation error:", error);

    // Mantém as páginas estáticas disponíveis mesmo
    // quando o Supabase estiver temporariamente indisponível.
    return fallbackSitemap;
  }
}
