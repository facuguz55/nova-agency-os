import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Nova OS`
    return () => { document.title = 'Nova Agency OS' }
  }, [title])
}
