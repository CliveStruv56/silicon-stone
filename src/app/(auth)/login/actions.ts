'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface LoginState {
    message: string;
}

export async function verifyPassword(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    const password = formData.get('password') as string
    const correctPassword = process.env.ADMIN_PASSWORD

    if (!correctPassword) {
        console.error("ADMIN_PASSWORD environment variable is not set.")
        return { message: 'Login unavailable: Contact Administrator' }
    }

    if (password === correctPassword) {
        const cookieStore = await cookies()
        cookieStore.set('ai-writer-auth', password, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })
        redirect('/admin')
    } else {
        return { message: 'Access Denied' }
    }
}
