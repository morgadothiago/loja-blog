import { cloneElement, isValidElement, type ReactNode } from "react";

// jsdom/Testing Library não renderizam Server Components assíncronos. Expande só os `async function` da árvore
// (e percorre `children`), deixando os demais componentes para o React renderizar normalmente.
const isAsync = (t: unknown): t is (props: object) => Promise<ReactNode> =>
  typeof t === "function" && t.constructor.name === "AsyncFunction";

export async function resolveServer(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveServer));
  if (!isValidElement(node)) return node;
  if (isAsync(node.type)) return resolveServer(await node.type(node.props as object));
  const props = node.props as { children?: ReactNode };
  if (props.children === undefined) return node;
  return cloneElement(node, undefined, await resolveServer(props.children));
}
