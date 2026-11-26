import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { loadNewsCatalogs } from "@/lib/admin/news/queries";
import { loadEventDetail, loadEventList } from "@/lib/admin/schedule/queries";
import AdminScheduleManager from "@/components/AdminScheduleManager";
import { isUuid } from "@/lib/admin/news/model";
import AdminText from "@/components/AdminText";

export const metadata:Metadata={title:"Events management",robots:{index:false,follow:false}};

type Props = { searchParams: Promise<{ edit?: string | string[] }> };

async function ScheduleWorkspace({searchParams}:Props){
  await connection();
  const admin=await requireActiveAdmin();
  if(!admin) redirect("/admin/login");
  const {edit}=await searchParams;
  let detail: Awaited<ReturnType<typeof loadEventDetail>> = null;
  let data: Awaited<ReturnType<typeof loadNewsCatalogs>>;
  let list: Awaited<ReturnType<typeof loadEventList>>;
  try {
    [data,list,detail]=await Promise.all([loadNewsCatalogs(admin.supabase),loadEventList(admin.supabase,{page:1}),isUuid(edit)?loadEventDetail(admin.supabase,edit):null]);
  }catch{
    return <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white"><div className="mx-auto max-w-7xl rounded-xl border border-red-500/30 bg-red-500/5 p-6"><AdminText>Unable to load the events workspace. Confirm that the Phase 2.3.1 migration was applied.</AdminText></div></main>;
  }
  return <AdminScheduleManager key={detail?.event.id} catalogs={data} initialList={list} initialDetail={detail??undefined}/>;
}

export default function Page(props:Props){
  return <Suspense fallback={<main className="min-h-screen bg-[#08090d] p-8 text-zinc-400"><AdminText>Loading...</AdminText></main>}><ScheduleWorkspace {...props}/></Suspense>;
}
