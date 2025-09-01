import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
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
  }, [])

  return !!isMobile
}
