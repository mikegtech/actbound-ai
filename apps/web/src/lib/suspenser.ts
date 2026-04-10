export default function suspenser<T>(asyncFunction: () => Promise<T>) {
  let status: "pending" | "success" | "error" = "pending";
  let result: T | unknown;
  const promise = asyncFunction().then(
    (res: T) => {
      status = "success";
      result = res;
    },
    (err: unknown) => {
      status = "error";
      result = err;
    },
  );

  return {
    read() {
      if (status === "pending") {
        throw promise;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result as T;
      }
    },
  };
}
