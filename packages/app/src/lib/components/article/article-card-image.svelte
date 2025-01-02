<script lang="ts">
  import type { ArticleWithInteraction } from '@clairvue/types';

  interface Props {
    article: ArticleWithInteraction;
    imageLoaded?: boolean;
    imageError?: boolean;
    type?: string;
  }

  let {
    article,
    imageLoaded = $bindable(false),
    imageError = $bindable(false),
    type = 'wide'
  }: Props = $props();
</script>

<div class="relative w-full overflow-hidden {type === 'square' ? 'rounded-lg' : 'rounded-t-lg'}">
  <a href={article.readable ? `/article/${article.slug}` : article.link} target="_blank">
    <img
      src={article.image}
      alt={article.title}
      loading="eager"
      class="bg-muted h-full w-full object-contain {type === 'square'
        ? 'max-h-36 min-h-24 min-w-24 max-w-52'
        : ''}"
      onload={() => {
        imageLoaded = true;
      }}
      onerror={() => {
        imageError = true;
      }}
    />
  </a>
</div>
