import { PageSkeleton } from '@/components/site/Skeleton'

/* `bare` — account layout нь `.shell` ба табуудаа аль хэдийн зурсан. */
export default function Loading() {
  return <PageSkeleton rows={3} bare />
}
