import * as React from 'react';
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui';

function ContextMenu(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Root>,
) {
  return <ContextMenuPrimitive.Root {...props} />;
}

function ContextMenuTrigger(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>,
) {
  return <ContextMenuPrimitive.Trigger {...props} />;
}

function ContextMenuContent(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Content>,
) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className="z-50 min-w-[10rem] rounded-lg border border-gray-500 bg-gray-800 p-1 shadow-2xl"
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem({
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  variant?: 'default' | 'destructive';
}) {
  return (
    <ContextMenuPrimitive.Item
      className={`flex cursor-default items-center rounded-md px-2.5 py-1.5 text-sm outline-none select-none ${
        variant === 'destructive'
          ? 'text-red-400 focus:bg-red-500/15'
          : 'text-gray-200 focus:bg-gray-700'
      } data-[disabled]:pointer-events-none data-[disabled]:opacity-40`}
      {...props}
    />
  );
}

function ContextMenuSeparator(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Separator>,
) {
  return (
    <ContextMenuPrimitive.Separator
      className="-mx-1 my-1 h-px bg-gray-700"
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
};
