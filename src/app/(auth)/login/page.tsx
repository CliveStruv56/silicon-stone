'use client'

import { useActionState } from 'react'
import { verifyPassword } from './actions'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
    const [state, formAction] = useActionState(verifyPassword, { message: '' })

    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-950 text-white">
            <div className="w-full max-w-sm p-8 space-y-6 bg-stone-900 border border-stone-800 rounded-xl">
                <h1 className="text-2xl font-bold text-center">Writer Access</h1>
                <form action={formAction} className="space-y-4" suppressHydrationWarning>
                    <input
                        type="password"
                        name="password"
                        placeholder="Enter access code"
                        className="w-full p-3 bg-black border border-stone-700 rounded text-stone-300 focus:border-blue-500 outline-none"
                    />
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                        Enter Studio
                    </Button>
                    {state?.message && (
                        <p className="text-red-400 text-sm text-center">{state.message}</p>
                    )}
                </form>
            </div>
        </div>
    )
}
