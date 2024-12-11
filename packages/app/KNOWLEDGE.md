Svelte 5 Component & Page Development Rules

1. Reactive Variables  
   Use `$state` for reactive variables. Avoid plain `let` for reactivity.

```svelte
<script>
  let count = $state(0);
</script>
```

2. Computed Values  
   Use `$derived` for values dependent on reactive variables.

```svelte
<script>
  let count = $state(0);
  let double = $derived(() => count * 2);
</script>
```

3. Reactive Statements and Effects  
   Replace `$:` with `$effect()` for derived computations or side effects.

```svelte
<script>
  import { $effect } from 'svelte';
  let count = $state(0);
  $effect(() => console.log(`Count is ${count}`));
</script>
```

4. Event Handlers  
   Simplify event handlers using standard properties like `onclick`.

```svelte
<button onclick={() => count++}>Increment</button>
```

5. Untracked Variables  
   Use `untrack` for variables that should not trigger reactivity.

```svelte
<script>
  import { untrack } from 'svelte';
  let a = $state(0);
  let b = $state(0);
  let sum = $derived(() => a + untrack(() => b));
</script>
```

6. Props Management  
   Use `...$props()` to destructure and spread props.

```svelte
<script>
  let { value, onClick } = $props();
</script>

<button onclick={onClick}>{value}</button>
```

7. Reusable Snippets and Render Tags  
   Utilize `#snippet` and `@render` for reusable and dynamic markup.  
   Consumer Example:

```svelte
<script>
  import Button from './Button.svelte';
</script>

<Button>
  {#snippet children(name)}
    Hello, {name}!
  {/snippet}
</Button>
```

Provider Example:

```svelte
<script>
  let { children } = $props();
</script>

<button>
  {@render children('Svelte 5')}
</button>
```

Key Principles:

1. Consistency: Adhere to Svelte 5's syntax and paradigms.
2. Simplification: Use features like runes and snippets.
3. Reactivity: Manage state and computed values predictably.
