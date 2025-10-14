import { getAllWorks } from '@/lib/works';
import type { WorkFromMd } from '@/lib/works';
import WorkPageShell from '@/components/WorkPageShell';

export default async function WorksPage() {
  const works: WorkFromMd[] = await getAllWorks();

  return <WorkPageShell works={works} />;
}