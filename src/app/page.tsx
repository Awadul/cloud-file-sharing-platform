import {Suspense} from 'react';
import {getSession} from '@/lib/session';
import {DashboardContent} from '@/components/Dashboard';
import MarketingLanding from '@/components/MarketingLanding';
async function ProductEntry(){const session=await getSession();return session?<DashboardContent initialTab="home"/>:<MarketingLanding/>;}
export default function HomePage(){return <Suspense fallback={<main className="pp-entry-loading" aria-busy="true"><p>Opening Plainpage…</p></main>}><ProductEntry/></Suspense>;}
