import { PathFixer } from '../services/PathFixer';

export async function fixPathsCommand(): Promise<void> {
    await PathFixer.fix();
}