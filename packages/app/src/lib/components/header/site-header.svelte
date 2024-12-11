<script lang="ts">
  import AppearancePopover from './appearance-popover.svelte';
  import { NavigationMobileSheet } from '../navigation';
  import { collectionsStore } from '@/stores/collections';
  import { feedsStore } from '@/stores/feeds';
  import Logo from '@/components/ui/logo/logo.svelte';
  import CreateArticleDialog from '../article/create-article-dialog.svelte';
  import { createArticle } from '$lib/api/article';
  import { cn, showToast } from '$lib/utils';
  import { Result } from '@clairvue/types';
  import { Import } from 'lucide-svelte';
  import { DialogTrigger } from '../ui/dialog';
  import { buttonVariants } from '../ui/button';
  import { goto } from '$app/navigation';

  let collections = $state($collectionsStore);
  let feeds = $state($feedsStore);

  let defaultFeed = $derived(feeds.find((feed) => feed.link.startsWith('default-feed')));

  async function save(articleData: {
    title: string;
    url: string;
    makeReadable: boolean;
  }): Promise<Result<string[], Error>> {
    if (!defaultFeed || !defaultFeed.id) {
      showToast('Error', 'No default feed found', 'error');
      return Result.err(new Error('No default feed found'));
    }
    return await createArticle(defaultFeed.id, articleData);
  }

  function handleSave(articleSlugs: string[]) {
    showToast('Success', 'Article saved', 'success', {
      label: 'View article',
      onClick: () => {
        goto(`/article/${articleSlugs[0]}`);
      }
    });
  }

  $effect(() => {
    collectionsStore.subscribe((value) => {
      collections = value;
    });

    feedsStore.subscribe((value) => {
      feeds = value;
    });
  });
</script>

<header
  class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 w-full border-b backdrop-blur"
>
  <div
    class="mx-auto flex h-12 w-full max-w-[90rem] items-center justify-between px-4 sm:h-14 lg:px-12"
  >
    <div class="mr-4 hidden items-center md:flex md:flex-1">
      <Logo />
    </div>

    <div class="flex flex-1 items-center md:hidden">
      <NavigationMobileSheet {collections} {feeds} />
    </div>
    <div class="flex items-center space-x-2 md:ml-auto">
      <CreateArticleDialog showButton={true} {save} onSave={handleSave}>
        <DialogTrigger
          title="Import article"
          class={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'bg-background/95 supports-[backdrop-filter]:bg-background/60 h-8 w-8 backdrop-blur sm:h-10 sm:w-10'
          )}
        >
          <Import class="h-4 w-4" />
        </DialogTrigger>
      </CreateArticleDialog>
      <AppearancePopover />
    </div>
  </div>
</header>
