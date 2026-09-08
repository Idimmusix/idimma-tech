import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.date(),
	}),
});

export const collections = { 'case-studies': caseStudies };
