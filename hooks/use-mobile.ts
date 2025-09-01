import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
<<<<<<< HEAD
    let mql: MediaQueryList | undefined
    if (typeof window !== "undefined") {
      mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    }
    const onChange = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
    }
    if (mql) {
      mql.addEventListener("change", onChange)
    }
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    return () => {
      if (mql) {
        mql.removeEventListener("change", onChange)
      }
    }
=======
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
>>>>>>> e43e63133f4241c27aa6a4baff57a456e061bff2
  }, [])

  return !!isMobile
}
