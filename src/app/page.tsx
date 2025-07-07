'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { Sword, Target, Users, BookOpen } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-base-200 min-h-screen">
        {/* Hero Section */}
        <div className="hero min-h-[80vh] bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold text-primary mb-6">LifeRPG</h1>
              <p className="text-xl text-base-content/80 mb-8">
                Turn your life into an epic adventure. Complete quests, gain XP, and level up your real-world skills.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/signup" className="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
                  <Sword size={20} />
                  Start Your Journey
                </Link>
                <Link href="/auth/signin" className="btn btn-outline btn-lg gap-2 transition-all duration-200 hover:scale-105">
                  Continue Adventure
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-base-content">
              Features That Level Up Your Life
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card bg-base-100 shadow-xl transition-all duration-200 hover:shadow-2xl">
                <div className="card-body text-center">
                  <Target className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h3 className="card-title justify-center">AI Quest Master</h3>
                  <p>Get personalized daily quests from your AI Dungeon Master that align with your goals and character class.</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl transition-all duration-200 hover:shadow-2xl">
                <div className="card-body text-center">
                  <Users className="w-12 h-12 mx-auto text-secondary mb-4" />
                  <h3 className="card-title justify-center">Family Bonds</h3>
                  <p>Special quests designed to strengthen relationships and create meaningful memories with your loved ones.</p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl transition-all duration-200 hover:shadow-2xl">
                <div className="card-body text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-accent mb-4" />
                  <h3 className="card-title justify-center">Journal Insights</h3>
                  <p>Reflect on your adventures with an AI-powered journal that extracts insights and awards XP for growth.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <DashboardContent />
}

function DashboardContent() {
  const { data: character } = trpc.character.get.useQuery()
  const { data: todos } = trpc.todos.getAll.useQuery()
  const { data: stats } = trpc.stats.getAll.useQuery()

  if (!character) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card bg-base-100 border-base-300 border shadow-2xl max-w-2xl mx-auto">
          <div className="card-body text-center p-8">
            <h2 className="card-title text-2xl justify-center mb-4">Welcome, Adventurer!</h2>
            <p className="text-base-content/70 mb-6">
              Before you can begin your epic journey, you need to create your character. 
              Choose your class, craft your backstory, and define your destiny!
            </p>
            <Link href="/character/create" className="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
              <Sword size={20} />
              Create Character
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activeTodos = todos?.filter(todo => !todo.completed) || []
  const todayXp = todos?.filter(todo => todo.completed && todo.completedAt && new Date(todo.completedAt).toDateString() === new Date().toDateString())
    .reduce((sum, todo) => sum + todo.xpReward, 0) || 0

  return (
    <div className="bg-base-200 min-h-screen">
      {/* Dashboard Header */}
      <div className="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-primary mb-2 text-4xl font-bold">
                Welcome back, {character.name}!
              </h1>
              <p className="text-base-content/70 text-lg">
                {character.class} • Level {Math.max(...(stats?.map(s => s.level) || [1]))} • {todayXp} XP today
              </p>
            </div>
            <Link href="/todos/create" className="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
              <Target size={20} />
              New Quest
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Active Quests */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6 text-base-content">Active Quests</h2>
            {activeTodos.length === 0 ? (
              <div className="card bg-base-100 border-base-300 border shadow-xl">
                <div className="card-body text-center">
                  <Target className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Quests</h3>
                  <p className="text-base-content/70 mb-4">Ready for your next adventure?</p>
                  <Link href="/todos/create" className="btn btn-primary">Create Quest</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTodos.map((todo) => (
                  <TodoCard key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Overview */}
            <div className="card bg-base-100 border-base-300 border shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Character Stats</h3>
                <div className="space-y-2">
                  {stats?.slice(0, 3).map((stat) => (
                    <div key={stat.id} className="flex justify-between items-center">
                      <span className="font-medium">{stat.name}</span>
                      <span className="badge badge-primary">Lv.{stat.level}</span>
                    </div>
                  ))}
                  {stats && stats.length > 3 && (
                    <Link href="/stats" className="btn btn-ghost btn-sm w-full">
                      View All Stats
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 border-base-300 border shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/journal" className="btn btn-outline btn-sm w-full gap-2">
                    <BookOpen size={16} />
                    Journal Entry
                  </Link>
                  <Link href="/character" className="btn btn-outline btn-sm w-full gap-2">
                    <Sword size={16} />
                    View Character
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TodoCard({ todo }: { todo: { id: string; title: string; description?: string | null; completed: boolean; xpReward: number } }) {
  const utils = trpc.useUtils()
  const updateTodo = trpc.todos.update.useMutation({
    onSuccess: () => {
      utils.todos.getAll.invalidate()
      utils.stats.getAll.invalidate()
    },
  })

  const handleComplete = () => {
    updateTodo.mutate({ id: todo.id, completed: true })
  }

  return (
    <div className="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="card-title text-lg">{todo.title}</h3>
            {todo.description && (
              <p className="text-base-content/70 mt-2">{todo.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <span className="badge badge-accent">+{todo.xpReward} XP</span>
            </div>
          </div>
          <button
            onClick={handleComplete}
            disabled={updateTodo.isPending}
            className="btn btn-primary btn-sm gap-2 transition-all duration-200 hover:scale-105"
          >
            {updateTodo.isPending ? (
              <div className="loading loading-spinner loading-xs" />
            ) : (
              'Complete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
