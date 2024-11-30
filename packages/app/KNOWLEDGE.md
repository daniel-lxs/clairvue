# What are runes?

Runes are symbols that influence the Svelte compiler. While Svelte currently uses `let`, `=`, the `export` keyword, and the `$:` label for specific functionality, runes adopt function syntax to achieve similar and expanded capabilities.

## Example: Reactive State with `$state`

```svelte
<script>
  let count = 0;
  let count = $state(0);

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  clicks: {count}
</button>
```

At first glance, this might seem less intuitive — isn’t it better if `let count` is reactive by default?  
However, as applications grow in complexity, distinguishing between reactive and non-reactive values can become tricky. The heuristic only applies to top-level `let` declarations in `.svelte` files, leading to confusion when code behaves differently in `.js` files. Refactoring code, such as turning a value into a store, can also become challenging.

---

## Beyond Components

Runes enable reactivity outside `.svelte` files. For example, consider encapsulating counter logic for reuse across components:

### Current Approach with Stores

**`counter.js`**

```javascript
import { writable } from 'svelte/store';

export function createCounter() {
  const { subscribe, update } = writable(0);

  return {
    subscribe,
    increment: () => update((n) => n + 1)
  };
}
```

**`App.svelte`**

```svelte
<script>
  import { createCounter } from './counter.js';

  const counter = createCounter();
</script>

<button on:click={counter.increment}>
  clicks: {$counter}
</button>
```

This works but can feel cumbersome, especially for more complex use cases.

---

### Simplified Approach with Runes

**`counter.svelte.js`**

```javascript
import { writable } from 'svelte/store';

export function createCounter() {
  let count = $state(0);

  return {
    get count() {
      return count;
    },
    increment: () => (count += 1)
  };
}
```

**`App.svelte`**

```svelte
<script>
  import { createCounter } from './counter.svelte.js';

  const counter = createCounter();
</script>

<button on:click={counter.increment}>
  clicks: {counter.count}
</button>
```

Runes can be used in `.svelte.js` and `.svelte.ts` files, extending reactivity beyond `.svelte` components. Using a `get` property ensures that `counter.count` always refers to the current value.

---

## Runtime Reactivity

Svelte traditionally uses **compile-time reactivity**. For example:

```svelte
<script>
  export let width;
  export let height;

  $: area = width * height;
  $: console.log(area);
</script>
```

Here, `area` is recalculated when `width` or `height` changes. But refactoring this code can lead to issues:

```javascript
const multiplyByHeight = (width) => width * height;

$: area = multiplyByHeight(width); // `area` won't update when `height` changes.
```

Svelte 5 introduces `$derived` and `$effect` runes to resolve such challenges:

```svelte
<script>
  let { width, height } = $props(); // Instead of `export let`

  const area = $derived(width * height);

  $effect(() => {
    console.log(area);
  });
</script>
```

These runes dynamically determine dependencies at runtime, simplifying complex logic.

---

## Signal Boost

Svelte 5’s reactivity is powered by **signals**, inspired by frameworks like Solid.js. Signals are an under-the-hood implementation detail, invisible to users but enabling fine-grained reactivity. For example, changes to a single value in a large list won't invalidate the entire list.

Signals make Svelte 5 exceptionally fast, particularly in server-side rendering, where unnecessary overhead is eliminated.

---

## Simpler Times Ahead

Runes replace many existing concepts, making Svelte simpler to use:

- No distinction between top-level and non-top-level `let` declarations.
- Eliminates `export let`.
- Replaces `$:` and its quirks.
- Simplifies `<script>` vs. `<script context="module">`.
- Deprecates `$$props` and `$$restProps`.
- Replaces lifecycle functions (e.g., `afterUpdate`) with `$effect`.
- Simplifies or replaces the store API and `$store` prefix (though stores are still supported).

For existing users, runes introduce new concepts that make Svelte apps easier to maintain. For newcomers, these changes streamline learning.

---

This is just the beginning — future releases aim to make Svelte even simpler and more capable.
