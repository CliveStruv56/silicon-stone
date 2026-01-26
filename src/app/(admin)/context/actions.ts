'use server';

import { saveICP, getICP } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { ICP } from "@/types/context";

type UpdateType = 'keyword' | 'pain_point';

interface ActionState {
    success: boolean;
    message: string;
}

// Extended ICP type that matches the actual JSON structure
interface ExtendedICP extends ICP {
    language?: {
        phrases_they_use?: string[];
    };
    psychographics?: {
        frustrations?: {
            list?: string[];
        };
    };
}

// Action 1: Update Context from Research (Keywords/Pain Points)
export async function updateContext(type: UpdateType, value: string): Promise<ActionState> {
    try {
        const icp = await getICP() as ExtendedICP;

        let modified = false;

        if (type === 'keyword') {
            if (!icp.language) icp.language = {};
            if (!icp.language.phrases_they_use) icp.language.phrases_they_use = [];

            if (!icp.language.phrases_they_use.includes(value)) {
                icp.language.phrases_they_use.push(value);
                modified = true;
            }
        } else if (type === 'pain_point') {
            if (!icp.psychographics) icp.psychographics = {};
            if (!icp.psychographics.frustrations) icp.psychographics.frustrations = {};
            if (!icp.psychographics.frustrations.list) icp.psychographics.frustrations.list = [];

            if (!icp.psychographics.frustrations.list.includes(value)) {
                icp.psychographics.frustrations.list.push(value);
                modified = true;
            }
        }

        if (modified) {
            await saveICP(icp);
            return { success: true, message: `Added "${value}" to ICP.` };
        } else {
            return { success: true, message: `"${value}" already exists in ICP.` };
        }

    } catch (error) {
        console.error("Failed to update ICP:", error);
        return { success: false, message: "Failed to update context file." };
    }
}

// Action 2: Update Persona from Editor Form
export async function updatePersona(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const originalKey = formData.get('originalKey') as string;
    const role = formData.get('role') as string;
    const painPoint = formData.get('painPoint') as string;
    const example = formData.get('example') as string;

    if (!originalKey || !role || !painPoint || !example) {
        return { success: false, message: "Missing required fields" };
    }

    try {
        const icp = await getICP() as ExtendedICP;

        if (!icp.personas || !icp.personas[originalKey]) {
            return { success: false, message: "Persona not found" };
        }

        icp.personas[originalKey] = {
            ...icp.personas[originalKey],
            role,
            pain_point: painPoint,
            example
        };

        await saveICP(icp);
        revalidatePath('/context');
        revalidatePath('/context/edit');
        return { success: true, message: "Persona updated successfully" };
    } catch (e) {
        console.error("Update Persona Failed:", e);
        return { success: false, message: e instanceof Error ? e.message : "Failed to update persona" };
    }
}
