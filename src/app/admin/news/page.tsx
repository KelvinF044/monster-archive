import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { loadNewsCatalogs, loadNewsDetail, loadNewsList } from "@/lib/admin/news/queries";
import AdminNewsManager from "@/components/AdminNewsManager";
import { isUuid } from "@/lib/admin/news/model";
import AdminText from "@/components/AdminText";

export const metadata:Metadata={title:"News management",robots:{index:false,follow:false}};

type Props = { searchParams: Promise<{ edit?: string | string[] }> };

async function NewsWorkspace({searchParams}:Props){
  await connection();
  const admin=await requireActiveAdmin();
  if(!admin) redirect("/admin/login");
  const {edit}=await searchParams;
  let detail: Awaited<ReturnType<typeof loadNewsDetail>> = null;
  let data: Awaited<ReturnType<typeof loadNewsCatalogs>>;
  let list: Awaited<ReturnType<typeof loadNewsList>>;
  try {
    [data,list,detail]=await Promise.all([loadNewsCatalogs(admin.supabase),loadNewsList(admin.supabase,{page:1}),isUuid(edit)?loadNewsDetail(admin.supabase,edit):null]);
  }catch{
    return <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white"><div className="mx-auto max-w-7xl rounded-xl border border-red-500/30 bg-red-500/5 p-6"><AdminText>Unable to load the news workspace. Confirm that the Phase 2.3.1 migration was applied.</AdminText></div></main>;
  }
  return <AdminNewsManager key={detail?.article.id} catalogs={data} initialList={list} initialDetail={detail??undefined}/>;
}

export default function Page(props:Props){
  return <Suspense fallback={<main className="min-h-screen bg-[#08090d] p-8 text-zinc-400"><AdminText>Loading...</AdminText></main>}><NewsWorkspace {...props}/></Suspense>;
}
