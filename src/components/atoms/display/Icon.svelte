<script lang="ts">
import OfflineIcon from "@iconify/svelte/dist/OfflineIcon.svelte";
import { addCollection } from "@iconify/svelte/dist/offline-functions";
import type { ComponentProps } from "svelte";
import { localIconCollections } from "@/generated/local-icon-collections";

for (const collection of localIconCollections) addCollection(collection);

let { icon, ...props }: ComponentProps<typeof OfflineIcon> = $props();
</script>

<OfflineIcon {icon} {...props} />
