import { getURL } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import React, { memo, useEffect, useRef, useState } from 'react'

const proxyLink = '/api/link-preview?url='
export const placeholderImg = '/fallback.png'

function isValidResponse(res: APIResponse | null): boolean {
  if (!res) return false

  return (
    res.title !== null &&
    res.description !== null &&
    res.image !== null &&
    res.siteName !== null &&
    res.hostname !== null &&
    res.title !== undefined &&
    res.description !== undefined &&
    res.image !== undefined &&
    res.siteName !== undefined &&
    res.hostname !== undefined &&
    res.image !== 'null' &&
    !res.image.startsWith('/')
  )
}

export interface LinkPreviewProps {
  url: string
  className?: string
  width?: string | number
  height?: string | number
  descriptionLength?: number
  borderRadius?: string | number
  imageHeight?: string | number
  textAlign?: 'left' | 'right' | 'center'
  margin?: string | number
  fallback?: JSX.Element[] | JSX.Element | null
  backgroundColor?: string
  primaryTextColor?: string
  secondaryTextColor?: string
  borderColor?: string
  showLoader?: boolean
  customLoader?: JSX.Element[] | JSX.Element | null
  openInNewTab?: boolean
  fetcher?: (url: string) => Promise<APIResponse | null>
  fallbackImageSrc?: string
  explicitImageSrc?: string | null
  /* Whether the placeholder image is displayed in case no image could be scraped */
  showPlaceholderIfNoImage?: boolean
  onSuccess?: (metadata: APIResponse | null) => void
}

export interface APIResponse {
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  hostname: string | null
}

const customFetcher = async (url: string) => {
  const response = await fetch(`${getURL()}api/link-preview?url=${url}`)
  const json = await response.json()
  return json.metadata
}

export default function LinkPreview({
  url,
  className = '',
  width,
  height,
  descriptionLength,
  borderRadius,
  imageHeight,
  textAlign,
  margin,
  fallback = null,
  primaryTextColor = 'black',
  secondaryTextColor = 'rgb(100, 100, 100)',
  showLoader = true,
  customLoader = null,
  openInNewTab = true,
  fetcher = customFetcher,
  fallbackImageSrc = placeholderImg,
  explicitImageSrc = null,
  showPlaceholderIfNoImage = false,
  onSuccess = (metadata: any) => {}
}: LinkPreviewProps) {
  const _isMounted = useRef(true)
  const [metadata, setMetadata] = useState<APIResponse | null>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    _isMounted.current = true
    setLoading(true)

    if (fetcher) {
      fetcher(url)
        .then(res => {
          if (_isMounted.current) {
            let metadata
            if (isValidResponse(res)) {
              metadata = res
              setMetadata(res)
            } else {
              metadata = null
              setMetadata(null)
            }
            onSuccess(metadata)
            setLoading(false)
          }
        })
        .catch((err: Error) => {
          console.error(err)
          console.error('No metadata could be found for the given URL.')
          if (_isMounted.current) {
            onSuccess(null)
            setMetadata(null)
            setLoading(false)
          }
        })
    } else {
      fetch(proxyLink + url)
        .then(res => res.json())
        .then(res => {
          if (_isMounted.current) {
            setMetadata(res.metadata as unknown as APIResponse)
            onSuccess(res.metadata)
            setLoading(false)
          }
        })
        .catch((err: Error) => {
          console.error(err)
          console.error('No metadata could be found for the given URL.')
          if (_isMounted.current) {
            onSuccess(null)
            setMetadata(null)
            setLoading(false)
          }
        })
    }

    return () => {
      _isMounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  if (loading && showLoader) {
    if (customLoader) {
      return <>{customLoader}</>
    } else {
      return (
        <div className="flex h-8 w-full animate-pulse space-x-4 rounded-md bg-gray-300/50" />
      )
    }
  }

  const onClick = () => {
    const browserTarget = openInNewTab ? '_blank' : '_self'
    window.open(url, browserTarget)
  }

  if (!metadata) {
    return (
      <div
        data-testid="container"
        onClick={onClick}
        className={cn(
          'cursor-pointer overflow-hidden rounded-lg border border-gray-300 bg-white hover:border-gray-400',
          className
        )}
        style={{
          width,
          height,
          borderRadius,
          textAlign,
          margin
        }}
      >
        <div className="px-3 py-2">
          <h3
            data-testid="title"
            className="line-clamp-1 text-sm font-medium"
            style={{ color: primaryTextColor }}
          >
            {url}
          </h3>
        </div>
      </div>
    )
  }

  const { image, description, title, siteName, hostname } = metadata

  return (
    <div
      data-testid="container"
      onClick={onClick}
      className={cn(
        'cursor-pointer overflow-hidden rounded-lg border border-gray-300 bg-white hover:border-gray-400',
        className
      )}
      style={{
        width,
        height,
        borderRadius,
        textAlign,
        margin
      }}
    >
      {(image || fallbackImageSrc) && showPlaceholderIfNoImage && (
        <div
          data-testid="image-container"
          style={{
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            backgroundImage: `url(${
              explicitImageSrc || image || fallbackImageSrc
            }), url(${fallbackImageSrc})`,
            height: imageHeight
          }}
          className="h-32 w-full bg-cover bg-center bg-no-repeat"
        ></div>
      )}
      <div className="px-3 py-2">
        <h3
          data-testid="title"
          className="line-clamp-2 text-sm font-medium"
          style={{ color: primaryTextColor }}
        >
          {title}
        </h3>
        {description && (
          <span
            data-testid="desc"
            className="line-clamp-2 text-xs"
            style={{ color: secondaryTextColor }}
          >
            {description}
          </span>
        )}
        <div className="text-xs" style={{ color: secondaryTextColor }}>
          {siteName && <span>{siteName} • </span>}
          <span>{hostname}</span>
        </div>
      </div>
    </div>
  )
}
