// Chapter Structure Templates — NovelloAI V34
// 30+ story structure frameworks for authors

export interface ChapterTemplate {
    id: string;
    name: string;
    category: string;
    description: string;
    chapters: Array<{ title: string; synopsis: string }>;
}

export const CHAPTER_TEMPLATES: ChapterTemplate[] = [
    {
        id: 'three-act',
        name: 'Three-Act Structure',
        category: 'Classic',
        description: 'The timeless dramatic framework: Setup, Confrontation, Resolution.',
        chapters: [
            { title: 'The World Before', synopsis: 'Introduce the protagonist in their ordinary world. Establish the status quo, key relationships, and the protagonist\'s core flaw or desire.' },
            { title: 'The Call to Adventure', synopsis: 'An inciting incident disrupts the protagonist\'s world and presents them with a challenge or opportunity they cannot ignore.' },
            { title: 'Crossing the Threshold', synopsis: 'The protagonist commits to the journey. They leave their comfort zone and enter a new, unfamiliar world with different rules.' },
            { title: 'Tests, Allies, and Enemies', synopsis: 'The protagonist faces trials, builds alliances, and encounters obstacles. They begin to learn the rules of this new world.' },
            { title: 'Approaching the Cave', synopsis: 'The protagonist prepares for the supreme ordeal. Stakes are raised. The protagonist must face their deepest fear.' },
            { title: 'The Ordeal', synopsis: 'The protagonist faces their greatest challenge. They appear to fail — death, defeat, or a dark moment of the soul.' },
            { title: 'The Reward', synopsis: 'Having survived the ordeal, the protagonist seizes the reward — knowledge, an object, or a new understanding of themselves.' },
            { title: 'The Road Back', synopsis: 'The protagonist begins the journey home but faces a final pursuit or complication. Old antagonists return.' },
            { title: 'The Resurrection', synopsis: 'The protagonist faces one final test where they must use everything they\'ve learned. They are transformed by the experience.' },
            { title: 'Return with the Elixir', synopsis: 'The protagonist returns changed, bringing something that benefits their world — wisdom, love, freedom, or treasure.' },
        ],
    },
    {
        id: 'save-the-cat',
        name: 'Save the Cat (Blake Snyder)',
        category: 'Screenplay',
        description: 'Blake Snyder\'s 15-beat screenplay structure adapted for novels.',
        chapters: [
            { title: 'Opening Image', synopsis: 'A visual snapshot that sets the tone and hints at the theme. Contrasts with the final image to show transformation.' },
            { title: 'Theme Stated', synopsis: 'Someone (usually not the protagonist) states the theme — the question the story will answer — often unrecognized by the protagonist.' },
            { title: 'Setup', synopsis: 'Introduce the protagonist\'s world, their flaws, and what they need (not what they want). Plant seeds for all future payoffs.' },
            { title: 'The Catalyst', synopsis: 'The life-changing event that knocks the protagonist out of their world. A phone call, an accident, a discovery.' },
            { title: 'Debate', synopsis: 'The protagonist resists the change. Should they take the challenge? They are afraid to cross the threshold.' },
            { title: 'Break into Two', synopsis: 'The protagonist makes a decisive choice and enters Act Two and a new world with new rules.' },
            { title: 'Fun and Games', synopsis: 'The premise of the movie — the "trailer moment". The protagonist explores this new world, both succeeding and failing.' },
            { title: 'Midpoint', synopsis: 'Either a false victory or false defeat. Stakes are raised, and the protagonist commits fully to the goal.' },
            { title: 'Bad Guys Close In', synopsis: 'Opposition regroups and tightens. The protagonist\'s team begins to fracture. Internal and external forces squeeze.' },
            { title: 'All Is Lost', synopsis: 'The lowest point. The opposite of the Midpoint. The protagonist loses everything they\'d gained. The "whiff of death."' },
            { title: 'Dark Night of the Soul', synopsis: 'The protagonist wallows in hopelessness. Then discovers the answer to the question posed at the Theme Stated beat.' },
            { title: 'Break into Three', synopsis: 'The protagonist has the solution. They take action with new purpose, armed with the thematic realization.' },
            { title: 'Finale', synopsis: 'The protagonist storms the castle, applying the lessons learned. Old world is synthesized with new skills. Antagonist is defeated.' },
            { title: 'Final Image', synopsis: 'The mirror of the Opening Image — proof of change. The world is different. The protagonist is transformed.' },
        ],
    },
    {
        id: 'hero-journey',
        name: "Hero's Journey (Campbell)",
        category: 'Mythic',
        description: "Joseph Campbell's monomyth — the universal story of transformation.",
        chapters: [
            { title: 'The Ordinary World', synopsis: 'The hero\'s home environment, establishing their strengths, weaknesses, and inner conflict before the journey begins.' },
            { title: 'The Call to Adventure', synopsis: 'The hero receives a challenge or quest that disrupts the ordinary world and presents the possibility of great adventure.' },
            { title: 'Refusal of the Call', synopsis: 'The hero hesitates or refuses — fear of the unknown. This creates tension and establishes the cost of the journey.' },
            { title: 'Meeting the Mentor', synopsis: 'The hero meets a mentor who provides training, equipment, or wisdom that prepares them for the journey.' },
            { title: 'Crossing the Threshold', synopsis: 'The hero commits to the adventure, leaving the ordinary world behind. Point of no return.' },
            { title: 'Tests, Allies, Enemies', synopsis: 'The hero navigates the special world — making friends, encountering enemies, and learning the rules.' },
            { title: 'Approach to the Inmost Cave', synopsis: 'Approaching the place of greatest danger — the hero must prepare for the ordeal.' },
            { title: 'The Ordeal', synopsis: 'The central crisis. The hero faces their greatest fear and experiences a symbolic death and rebirth.' },
            { title: 'Reward', synopsis: 'Surviving the ordeal, the hero receives a reward — often knowledge or an object of power.' },
            { title: 'The Road Back', synopsis: 'The hero begins the return, which often brings the final conflict or pursuit.' },
            { title: 'Resurrection', synopsis: 'A final, climactic ordeal purifies the hero completely before returning home.' },
            { title: 'Return with the Elixir', synopsis: 'The hero returns home transformed, bearing something of value for their community.' },
        ],
    },
    {
        id: 'story-circle',
        name: "Dan Harmon's Story Circle",
        category: 'Minimalist',
        description: 'A simplified 8-step version of the hero\'s journey used in TV drama.',
        chapters: [
            { title: 'You — A Character in a Zone of Comfort', synopsis: 'Establish the protagonist in their comfortable, familiar world.' },
            { title: 'Need — A Call to Adventure', synopsis: 'The protagonist wants or needs something, driving them out of comfort.' },
            { title: 'Go — Cross the Threshold', synopsis: 'The protagonist commits to getting what they want and enters an unfamiliar situation.' },
            { title: 'Search — Adapting to the New World', synopsis: 'The protagonist struggles in the unfamiliar world, adapting and searching.' },
            { title: 'Find — Getting What They Wanted', synopsis: 'The protagonist gets what they wanted — but at a price.' },
            { title: 'Take — Pay a Heavy Price', synopsis: 'The protagonist must pay the toll for what they found.' },
            { title: 'Return — Return to the Familiar', synopsis: 'The protagonist returns to the familiar situation, changed.' },
            { title: 'Change — Having Changed', synopsis: 'The protagonist is different. The original zone of comfort has changed because the protagonist has changed.' },
        ],
    },
    {
        id: 'kishōtenketsu',
        name: 'Kishōtenketsu (Japanese 4-Act)',
        category: 'Eastern',
        description: 'Traditional Japanese/Chinese 4-act structure with no conflict as a driver.',
        chapters: [
            { title: 'Ki — Introduction', synopsis: 'Introduce the characters, setting, and tone. No conflict. Establish the world with calm clarity.' },
            { title: 'Shō — Development', synopsis: 'Continue developing the characters and world. Events follow naturally from the introduction without a major twist.' },
            { title: 'Ten — Twist', synopsis: 'An unexpected turn that recontextualizes everything before it. Not a conflict — a revelation, a new perspective.' },
            { title: 'Ketsu — Reconciliation', synopsis: 'Bring together all elements — introduction, development, and twist — into a harmonious conclusion.' },
        ],
    },
    {
        id: 'seven-point',
        name: 'Seven-Point Story Structure',
        category: 'Classic',
        description: 'Dan Wells\' structure that works backward from the resolution.',
        chapters: [
            { title: 'The Hook', synopsis: 'The opening image or scene that captures the reader\'s attention. Often the opposite of the resolution.' },
            { title: 'Plot Turn 1', synopsis: 'Something happens that sets the protagonist on course toward the midpoint. The inciting incident.' },
            { title: 'Pinch Point 1', synopsis: 'The antagonistic force is felt directly. The protagonist faces a reminder of the stakes.' },
            { title: 'Midpoint', synopsis: 'The protagonist shifts from reaction to action. A key revelation changes everything.' },
            { title: 'Pinch Point 2', synopsis: 'The antagonistic force strikes again, harder. The protagonist seems defeated.' },
            { title: 'Plot Turn 2', synopsis: 'The protagonist discovers the last crucial piece they need to resolve the conflict.' },
            { title: 'Resolution', synopsis: 'The protagonist resolves the conflict — having been transformed from who they were at the Hook.' },
        ],
    },
    {
        id: 'fichtean-curve',
        name: 'Fichtean Curve',
        category: 'Thriller',
        description: 'Starts in the middle of action with escalating crises — great for thrillers.',
        chapters: [
            { title: 'In Media Res — Crisis 1', synopsis: 'Drop the reader directly into action. First crisis introduces protagonist under pressure.' },
            { title: 'Rising Action — Crisis 2', synopsis: 'A second crisis escalates from the first. Stakes grow. Protagonist must adapt.' },
            { title: 'Rising Action — Crisis 3', synopsis: 'Third crisis. The problem compounds. Simple solutions are exhausted.' },
            { title: 'Rising Action — Crisis 4', synopsis: 'Fourth crisis — the situation appears hopeless. Everything the protagonist has tried has failed.' },
            { title: 'Climax — Final Crisis', synopsis: 'The ultimate confrontation. All story threads converge. The protagonist faces the root cause of all crises.' },
            { title: 'Falling Action', synopsis: 'The aftermath of the climax. Loose ends are tied. The cost of victory is counted.' },
            { title: 'Resolution', synopsis: 'The new equilibrium. The protagonist and world reflect the transformation of the journey.' },
        ],
    },
    {
        id: 'freytag',
        name: "Freytag's Pyramid",
        category: 'Classic',
        description: "Gustav Freytag's classic dramatic pyramid from antiquity and Shakespeare.",
        chapters: [
            { title: 'Exposition', synopsis: 'Background information for the reader. Cast, setting, and essential backstory.' },
            { title: 'Rising Action', synopsis: 'Events that build tension and lead toward the climax. Complications arise.' },
            { title: 'Climax', synopsis: 'The turning point — the moment of highest dramatic tension. The fate of the protagonist is decided.' },
            { title: 'Falling Action', synopsis: 'Events following the climax. Tension relaxes as consequences play out.' },
            { title: 'Denouement', synopsis: 'Final resolution. Loose ends are resolved. The new order is established.' },
        ],
    },
];

export function getTemplateById(id: string): ChapterTemplate | undefined {
    return CHAPTER_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(): Record<string, ChapterTemplate[]> {
    return CHAPTER_TEMPLATES.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
    }, {} as Record<string, ChapterTemplate[]>);
}
