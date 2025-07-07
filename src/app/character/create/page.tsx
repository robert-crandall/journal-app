'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { characterSchema, type CharacterInput } from '@/lib/schemas'
import { trpc } from '@/lib/trpc/client'
import { Sword, Scroll, Target } from 'lucide-react'

const CHARACTER_CLASSES = [
  'Warrior',
  'Ranger',
  'Mage',
  'Rogue',
  'Paladin',
  'Druid',
  'Custom'
]

export default function CreateCharacterPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CharacterInput>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      class: 'Ranger',
    },
  })

  const createCharacter = trpc.character.create.useMutation({
    onSuccess: () => {
      router.push('/')
      router.refresh()
    },
  })

  const onSubmit = (data: CharacterInput) => {
    createCharacter.mutate(data)
  }

  const selectedClass = watch('class')

  return (
    <div className="bg-base-200 min-h-screen">
      {/* Header */}
      <div className="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-primary mb-2 text-4xl font-bold">Create Your Character</h1>
            <p className="text-base-content/70 text-lg">
              Define your identity and begin your adventure
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 border-base-300 border shadow-2xl">
              <div className="card-body p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Character Name */}
                  <div className="form-control">
                    <label className="label" htmlFor="name">
                      <span className="label-text font-medium text-lg">Character Name *</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your character's name"
                      className={`input input-bordered input-lg w-full transition-all duration-200 focus:scale-[1.02] ${
                        errors.name ? 'input-error' : 'focus:input-primary'
                      }`}
                      {...register('name')}
                    />
                    {errors.name && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.name.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Class Selection */}
                  <div className="form-control">
                    <label className="label" htmlFor="class">
                      <span className="label-text font-medium text-lg">Class *</span>
                    </label>
                    <select
                      id="class"
                      className={`select select-bordered select-lg w-full transition-all duration-200 focus:scale-[1.02] ${
                        errors.class ? 'select-error' : 'focus:select-primary'
                      }`}
                      {...register('class')}
                    >
                      {CHARACTER_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                    {errors.class && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.class.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Backstory */}
                  <div className="form-control">
                    <label className="label" htmlFor="backstory">
                      <span className="label-text font-medium text-lg">Backstory</span>
                      <span className="label-text-alt text-xs opacity-60">Optional</span>
                    </label>
                    <textarea
                      id="backstory"
                      placeholder="Tell us about your character's background and motivation..."
                      className="textarea textarea-bordered textarea-lg h-32 w-full transition-all duration-200 focus:scale-[1.02] focus:textarea-primary"
                      {...register('backstory')}
                    />
                  </div>

                  {/* Goals */}
                  <div className="form-control">
                    <label className="label" htmlFor="goals">
                      <span className="label-text font-medium text-lg">Personal Goals</span>
                      <span className="label-text-alt text-xs opacity-60">Optional</span>
                    </label>
                    <textarea
                      id="goals"
                      placeholder="What do you want to achieve? What kind of person do you want to become?"
                      className="textarea textarea-bordered textarea-lg h-32 w-full transition-all duration-200 focus:scale-[1.02] focus:textarea-primary"
                      {...register('goals')}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={createCharacter.isPending}
                      className="btn btn-primary btn-lg gap-2 px-8 shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      {createCharacter.isPending ? (
                        <>
                          <div className="loading loading-spinner loading-sm" />
                          Creating Character...
                        </>
                      ) : (
                        <>
                          <Sword size={20} />
                          Begin Adventure
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Class Info */}
            <div className="card bg-base-100 border-base-300 border shadow-xl">
              <div className="card-body">
                <h3 className="card-title gap-2">
                  <Scroll size={20} />
                  Class Guide
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedClass === 'Warrior' && (
                    <p>Strong and disciplined. Focus on physical challenges and building resilience.</p>
                  )}
                  {selectedClass === 'Ranger' && (
                    <p>Outdoor adventurer. Perfect for hiking, camping, and connecting with nature.</p>
                  )}
                  {selectedClass === 'Mage' && (
                    <p>Knowledge seeker. Ideal for learning new skills and intellectual pursuits.</p>
                  )}
                  {selectedClass === 'Rogue' && (
                    <p>Clever and adaptable. Great for creative projects and problem-solving.</p>
                  )}
                  {selectedClass === 'Paladin' && (
                    <p>Noble protector. Focus on helping others and community service.</p>
                  )}
                  {selectedClass === 'Druid' && (
                    <p>Nature lover. Balance between outdoor activities and mindful living.</p>
                  )}
                  {selectedClass === 'Custom' && (
                    <p>Create your own path. Define your character however you see fit.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="card bg-base-100 border-base-300 border shadow-xl">
              <div className="card-body">
                <h3 className="card-title gap-2">
                  <Target size={20} />
                  Tips
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>• Choose a name that inspires you</li>
                  <li>• Your class influences quest types</li>
                  <li>• Backstory helps the AI understand you</li>
                  <li>• Goals guide your daily missions</li>
                  <li>• You can update everything later</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
