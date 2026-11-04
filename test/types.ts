// Compile-time checks only (run with `npm run typecheck`).
import { useFetchError, to, tryCatch, HttpError, type Result } from "../src/index";

interface Post {
  id: number;
  title: string;
}

async function check() {
  const [error, post] = await useFetchError<Post>("/posts/1");
  if (error) {
    const message: string = error.message;
    if (error instanceof HttpError) {
      const status: number = error.status;
    }
    // @ts-expect-error data is undefined when there is an error
    post.title;
    return;
  }
  const title: string = post.title;

  const [, n] = await to(Promise.resolve(1));
  const maybe: number | undefined = n;

  const parsed: Result<unknown> = tryCatch(JSON.parse, "{}");

  // @ts-expect-error parseAs only accepts known values
  await useFetchError("/x", { parseAs: "xml" });
}
