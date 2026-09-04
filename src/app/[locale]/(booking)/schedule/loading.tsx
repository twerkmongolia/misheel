import { PageSkeleton } from '@/components/site/Skeleton'

/* Хуваарь нь хичээл, багш, байршил, бүртгэлийн тоог зэрэг татдаг — сайтын
   хамгийн олон асуулгатай хуудас. */
export default function Loading() {
  return <PageSkeleton rows={5} />
}
