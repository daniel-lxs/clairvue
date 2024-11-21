import { toast } from 'svelte-sonner';

export default function showToast(
  title: string,
  description: string,
  toastState: 'error' | 'success' | 'info' | 'warning' | 'loading' = 'success',
  action?: {
    label: string;
    onClick: () => void;
  }
) {
  toast[toastState](title, {
    description,
    action
  });
}
