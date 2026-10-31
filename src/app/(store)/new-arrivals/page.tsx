import { redirect } from 'next/navigation';

export default function NewArrivals() {
  redirect('/shop?sort=newest');
}
