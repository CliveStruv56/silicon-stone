export interface ImportState {
    success: boolean;
    message: string;
    articleId: string;
}

export const IMPORT_INITIAL_STATE: ImportState = {
    success: false,
    message: "",
    articleId: "",
};
