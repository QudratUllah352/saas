import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Submit a SaaS Deal',
  description: 'Submit a SaaS deal for the SaaSpin team to review.',
  path: '/submit-deal',
});

export default function SubmitDealLayout({ children }) {
  return children;
}
