import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const apiKey = searchParams.get('key')

  if (!query || !apiKey) {
    return NextResponse.json({ error: 'Missing query or API key' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(
        query
      )}&type=video&key=${apiKey}`
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.error?.message || 'API request failed' }, { status: response.status })
    }

    const data = await response.json()

    const videos = data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
    })) || []

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
