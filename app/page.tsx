'use client'

import { useState, useEffect } from 'react'
import { Play, List, Clock, Download, Search, Youtube } from 'lucide-react'

interface Video {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  duration?: string
}

interface AutomationTask {
  id: string
  name: string
  type: 'download' | 'playlist' | 'schedule'
  status: 'pending' | 'running' | 'completed' | 'failed'
  videoCount: number
  createdAt: string
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiInput, setShowApiInput] = useState(true)

  useEffect(() => {
    const savedKey = localStorage.getItem('youtube_api_key')
    if (savedKey) {
      setApiKey(savedKey)
      setShowApiInput(false)
    }
  }, [])

  const saveApiKey = () => {
    localStorage.setItem('youtube_api_key', apiKey)
    setShowApiInput(false)
  }

  const searchVideos = async () => {
    if (!searchQuery || !apiKey) return

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&key=${apiKey}`)
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error('Search failed:', error)
      setVideos([])
    }
    setLoading(false)
  }

  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideos)
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId)
    } else {
      newSelected.add(videoId)
    }
    setSelectedVideos(newSelected)
  }

  const createAutomationTask = (type: 'download' | 'playlist' | 'schedule') => {
    if (selectedVideos.size === 0) return

    const task: AutomationTask = {
      id: Date.now().toString(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${selectedVideos.size} videos`,
      type,
      status: 'pending',
      videoCount: selectedVideos.size,
      createdAt: new Date().toISOString()
    }

    setAutomationTasks([task, ...automationTasks])

    setTimeout(() => {
      setAutomationTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, status: 'running' } : t)
      )
    }, 1000)

    setTimeout(() => {
      setAutomationTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t)
      )
    }, 3000)

    setSelectedVideos(new Set())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Youtube className="w-12 h-12 text-red-500" />
          <h1 className="text-4xl font-bold">YouTube Automation</h1>
        </div>

        {showApiInput && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-purple-500">
            <h2 className="text-xl font-semibold mb-4">Setup YouTube API Key</h2>
            <p className="text-gray-300 mb-4">
              Enter your YouTube Data API v3 key to enable video search.
              Get one from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Cloud Console</a>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter YouTube API Key"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={saveApiKey}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Search className="w-6 h-6" />
                Search Videos
              </h2>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                  placeholder="Search for videos..."
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                  disabled={!apiKey}
                />
                <button
                  onClick={searchVideos}
                  disabled={loading || !apiKey}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Searching videos...</p>
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => toggleVideoSelection(video.id)}
                      className={`flex gap-4 p-4 rounded-lg cursor-pointer transition ${
                        selectedVideos.has(video.id)
                          ? 'bg-purple-600/30 border-2 border-purple-500'
                          : 'bg-gray-700/50 border-2 border-transparent hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 line-clamp-2">{video.title}</h3>
                        <p className="text-sm text-gray-400">{video.channelTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Youtube className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Search for videos to get started</p>
                </div>
              )}
            </div>

            {selectedVideos.size > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
                <h2 className="text-2xl font-semibold mb-4">
                  Create Automation ({selectedVideos.size} videos selected)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => createAutomationTask('download')}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                  >
                    <Download className="w-8 h-8" />
                    <span className="font-semibold">Download</span>
                  </button>
                  <button
                    onClick={() => createAutomationTask('playlist')}
                    className="flex flex-col items-center gap-2 p-4 bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    <List className="w-8 h-8" />
                    <span className="font-semibold">Playlist</span>
                  </button>
                  <button
                    onClick={() => createAutomationTask('schedule')}
                    className="flex flex-col items-center gap-2 p-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
                  >
                    <Clock className="w-8 h-8" />
                    <span className="font-semibold">Schedule</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Play className="w-6 h-6" />
                Automation Tasks
              </h2>
              {automationTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {automationTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{task.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            task.status === 'completed'
                              ? 'bg-green-500'
                              : task.status === 'running'
                              ? 'bg-yellow-500'
                              : task.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {task.videoCount} videos • {new Date(task.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-3">Features</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Search YouTube videos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Multi-select videos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Create automation tasks
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Track task progress
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
