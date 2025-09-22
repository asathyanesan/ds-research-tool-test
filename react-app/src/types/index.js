// Type definitions for DS Research Tool (JSDoc format for JSX)

/**
 * @typedef {Object} AnimalModel
 * @property {string} id
 * @property {string} name
 * @property {string} species
 * @property {string} background
 * @property {string} trisomy
 * @property {string} genes
 * @property {string[]} phenotypes
 * @property {string[]} advantages
 * @property {string[]} limitations
 * @property {string[]} applications
 * @property {string} jackson_link
 * @property {string} rrid
 * @property {string[]} [references]
 * @property {KeyPaper[]} [key_papers]
 */

/**
 * @typedef {Object} KeyPaper
 * @property {string} title
 * @property {string} authors
 * @property {string} year
 * @property {string} pmid
 */

/**
 * @typedef {Object} ARRIVEGuideline
 * @property {string} category
 * @property {string} item
 * @property {string} [details]
 * @property {boolean} checked
 */

/**
 * @typedef {Object} ChatMessage
 * @property {'user' | 'assistant'} type
 * @property {string} content
 */

/**
 * @typedef {'models' | 'compare' | 'design' | 'guidelines' | 'chat'} TabType
 */

export {};