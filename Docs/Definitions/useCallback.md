# useCallback

useCallback is a React Hook that lets you cache a function definition between re-renders.
Call useCallback at the top level of your component to cache a function definition between re-renders:


Signature: const cachedFn = useCallback(fn, dependencies)

Returns 
On the initial render, useCallback returns the fn function you have passed.

During subsequent renders, it will either return an already stored fn  function from the last render (if the dependencies haven’t changed), or return the fn function you have passed during this render.


Example

export default function ProductPage({ productId, referrer, theme }) {
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);

}


You need to pass two things to useCallback:

A function definition that you want to cache between re-renders.
A list of dependencies including every value within your component that’s used inside your function.
On the initial render, the returned function you’ll get from useCallback will be the function you passed.

On the following renders, React will compare the dependencies with the dependencies you passed during the previous render. If none of the dependencies have changed (compared with Object.is), useCallback will return the same function as before. Otherwise, useCallback will return the function you passed on this render.

In other words, useCallback caches a function between re-renders until its dependencies change.


By default, when a component re-renders, React re-renders all of its children recursively. 
This is why, when ProductPage re-renders with a different theme, the ShippingForm component also re-renders. This is fine for components that don’t require much calculation to re-render. But if you verified a re-render is slow, you can tell ShippingForm to skip re-rendering when its props are the same as on last render by wrapping it in memo:

In JavaScript, a function () {} or () => {} always creates a different function, similar to how the {} object literal always creates a new object. Normally, this wouldn’t be a problem, but it means that ShippingForm props will never be the same, and your memo optimization won’t work. This is where useCallback comes in handy:


function ProductPage({ productId, referrer, theme }) {
  // Tell React to cache your function between re-renders...
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]); // ...so as long as these dependencies don't change...

  return (
    <div className={theme}>
      {/* ...ShippingForm will receive the same props and can skip re-rendering */}
      <ShippingForm onSubmit={handleSubmit} />
    </div>
  );
}

# Caching a function with useCallback  is only valuable in a few cases:

You pass it as a prop to a component wrapped in memo. You want to skip re-rendering if the value hasn’t changed. Memoization lets your component re-render only if dependencies changed.
The function you’re passing is later used as a dependency of some Hook. For example, another function wrapped in useCallback depends on it, or you depend on this function from useEffect.


You should only rely on useCallback as a performance optimization. If your code doesn’t work without it, find the underlying problem and fix it first. Then you may add useCallback back.

