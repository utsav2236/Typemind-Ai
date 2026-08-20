import crypto from 'crypto';
import GuestTypingSession from '../models/GuestTypingSession.js';

// Hardcoded passages categorized by duration and topic
const PASSAGES = {
  30: [
    {
      topic: 'motivation',
      text: "The modern world moves incredibly fast. To keep up, one must learn to adapt to new situations daily. Consistency is often more important than raw speed. When you focus on small, incremental improvements over a long period of time, the compound effect can lead to massive success. Most people overestimate what they can do in a day, but underestimate what they can achieve in a year. Remember to pace yourself, take deliberate breaks, and focus on the process rather than just the destination."
    },
    {
      topic: 'travel',
      text: "Traveling opens up a new world of perspectives. When you step outside your comfort zone, you learn more about yourself than the places you visit. Immersing yourself in a foreign culture teaches you empathy, resilience, and problem-solving. Whether you are navigating a bustling train station in Tokyo or hiking a quiet trail in the Andes, every journey leaves a permanent mark on your character. The memories you create will outlast any physical souvenir you might bring back home to your family."
    }
  ],
  60: [
    {
      topic: 'productivity',
      text: "Digital minimalism is about intentionally choosing which technologies add value to your life and ignoring the rest. It is a philosophy that helps you reclaim your time and focus in an increasingly noisy world. By limiting distractions, you can achieve deeper work and more meaningful connections. Instead of letting algorithms dictate what captures your attention, you take back control. This doesn't mean abandoning the internet completely; rather, it means using digital tools purposefully. When you apply this mindset, you will find that you have much more free time than you previously realized. That extra time can be spent developing real-world hobbies, reading longer books, or simply enjoying the company of your family and friends without the constant urge to check your phone. Productivity is not merely about doing more things in less time; it is about focusing your energy on the tasks that truly matter. By eliminating shallow tasks, you achieve a state of flow where your best work is produced, leaving you fulfilled."
    },
    {
      topic: 'space',
      text: "The exploration of Mars has captivated human imagination for decades. Rovers have traversed the red, dusty landscape, sending back breathtaking images of a desolate world. Scientists hope that understanding Mars will provide clues about the early history of our own planet and the potential for life elsewhere. The logistical challenges of sending humans to Mars are immense, requiring breakthroughs in propulsion, life support systems, and radiation shielding. Yet, space agencies and private companies continue to push the boundaries of what is possible. If humanity successfully establishes a permanent settlement on another planet, it will mark a fundamental turning point in our history as a species, transforming us into a multi-planetary civilization capable of surviving cosmic catastrophes. Beyond Mars, the vastness of the cosmos beckons. The development of advanced telescopes allows us to peer into the distant past, observing galaxies formed shortly after the Big Bang, reminding us of our shared origins."
    }
  ],
  180: [
    {
      topic: 'history',
      text: "The Industrial Revolution marked a major turning point in history; almost every aspect of daily life was influenced in some way. Average income and population began to exhibit unprecedented sustained growth. Before this era, manufacturing was often done in people's homes, using hand tools or basic machines. Industrialization marked a shift to powered, special-purpose machinery, factories, and mass production. The iron and textile industries, along with the development of the steam engine, played central roles. While it brought about a greater volume and variety of factory-produced goods, it also led to grim employment and living conditions for the poor and working classes. Cities grew at an explosive rate, lacking proper infrastructure, sanitation, and clean water. Children were frequently employed in dangerous factories to help support their impoverished families. It took decades of labor movements, strikes, and social reform to establish basic workers' rights, such as the eight-hour workday and child labor laws. Despite these harsh realities, the technological innovations of this era laid the foundation for the modern world. The transition from an agrarian society to an industrial powerhouse fundamentally altered the global economic landscape, setting the stage for the unprecedented technological advancements of the twentieth century. The expansion of the railway network facilitated the rapid transport of goods and people, shrinking the perceived size of the world and accelerating the pace of cultural exchange. The invention of the telegraph revolutionized communication, allowing information to travel across continents in minutes rather than weeks. This interconnectedness spurred international trade and globalization, laying the groundwork for the complex, interdependent global economy we navigate today. Simultaneously, advancements in medicine and public health began to increase life expectancy and reduce mortality rates, contributing to a massive population boom. The profound societal shifts brought about by industrialization also sparked new philosophical and political movements. Thinkers and activists began to question the massive inequalities generated by unregulated capitalism, leading to the rise of socialist and communist ideologies. The struggle between labor and capital became a defining theme of the era, shaping political discourse and policy for generations. The rapid urbanization also transformed the nature of community and social interaction, replacing close-knit rural villages with sprawling, anonymous cities. This period of intense upheaval forced humanity to adapt to a radically new way of living, one governed by the rhythm of the machine rather than the cycles of nature. Understanding this pivotal period is essential for comprehending the complex forces that continue to shape our world, from economic disparity and environmental challenges to the ongoing pursuit of social justice and equitable distribution of resources."
    }
  ],
  300: [
    {
      topic: 'technology',
      text: "The development of artificial intelligence has sparked intense debate about the future of work and human creativity. While some fear that machines will replace human workers across numerous industries, others argue that AI will act as a powerful tool to augment human capabilities. Throughout history, every major technological revolution—from the printing press to the internet—has disrupted existing systems while creating entirely new categories of employment and expression. The key difference with AI is the pace of adoption and the cognitive nature of the tasks it can perform. As we navigate this transition, adaptability and continuous learning will become the most valuable human skills. Those who learn to collaborate with intelligent systems, rather than competing against them, will likely thrive in this new era. Furthermore, as machines handle routine analytical tasks, uniquely human traits such as emotional intelligence, empathy, and complex ethical judgment will become increasingly prized in the modern workplace. The challenge for society is ensuring that the benefits of these remarkable technologies are distributed equitably, and that education systems evolve to prepare future generations for a world where the boundary between human and machine intelligence is continually shifting. We must also consider the philosophical implications of creating machines that can mimic human thought so convincingly. As natural language processing models become more advanced, the line between human and machine-generated content blurs. This requires a renewed emphasis on critical thinking and digital literacy, ensuring that citizens can effectively navigate a media landscape filled with synthetic information. Ultimately, the future of AI is not predetermined; it will be shaped by the regulatory frameworks we establish today, the ethical guidelines we program into these systems, and the societal values we choose to prioritize as we integrate these unprecedented tools into our daily lives across all global sectors. Beyond the realm of software, physical robotics is undergoing a similar renaissance. Advances in machine vision and spatial awareness are allowing robots to navigate complex, unstructured environments with unprecedented agility. In manufacturing, collaborative robots, or cobots, are working safely alongside human operators, taking over physically demanding or repetitive tasks while humans handle the nuanced assembly that requires fine motor skills and judgment. In healthcare, robotic surgical systems are enabling minimally invasive procedures with extraordinary precision, reducing recovery times and improving patient outcomes. Autonomous vehicles, though still facing significant regulatory and technical hurdles, promise to eventually revolutionize transportation by reducing accidents caused by human error and optimizing traffic flow. The physical manifestation of AI into the real world represents the next great frontier of technological progress. The environmental impact of this technological explosion is a critical concern. Training massive neural networks requires enormous computational power, leading to a significant carbon footprint. The data centers that power our digital lives consume vast amounts of electricity and water for cooling. Consequently, the tech industry is under increasing pressure to transition to renewable energy sources and develop more efficient algorithms. However, technology also offers powerful solutions to environmental challenges. AI is being used to optimize energy grids, predict extreme weather events, and model complex climate systems with greater accuracy. Precision agriculture utilizes drones and sensors to maximize crop yields while minimizing the use of water and chemical fertilizers. The transition to a sustainable global economy will inevitably rely on these advanced technologies to monitor, manage, and mitigate our impact on the natural world around us. As we look to the horizon, the convergence of AI, biotechnology, and quantum computing holds the potential to solve some of humanity's most intractable problems. Quantum computers, operating on the principles of quantum mechanics, could exponentially accelerate drug discovery and materials science by simulating molecular interactions with perfect accuracy. Meanwhile, biotechnology is giving us the tools to edit the fundamental code of life, offering the tantalizing possibility of curing genetic diseases and extending human healthspan. Navigating this era of exponential change will require immense wisdom, global cooperation, and a deep commitment to human flourishing. We are not merely observers of this technological revolution; we are its architects. The choices we make in the coming decades will ripple outward, shaping the destiny of our species and the planet we call home, echoing far into the distant future where the limits of our imagination define reality."
    }
  ]
};

/**
 * Get a random guest typing passage entirely from hardcoded text.
 */
export const generateGuestPassage = async (duration, sessionId, testId) => {
  // 1. Get passages for the requested duration (fallback to 60 if somehow invalid)
  const availablePassages = PASSAGES[duration] || PASSAGES[60];
  
  // 2. Fetch recent guest passages to prevent showing the exact same text twice in a row
  let recentHash = null;
  try {
    const recentSession = await GuestTypingSession.findOne({ sessionId })
      .sort({ createdAt: -1 })
      .lean();
    if (recentSession) {
      recentHash = recentSession.textHash;
    }
  } catch (err) {
    console.error('[GuestTyping] Failed to fetch recent session:', err.message);
  }

  // 3. Select a random passage (try to avoid the most recently used one)
  let selectedPassage = availablePassages[Math.floor(Math.random() * availablePassages.length)];
  let textHash = crypto.createHash('sha256').update(selectedPassage.text).digest('hex');
  
  // If we only have a few passages, it's possible we pick the same one. Try picking again up to 3 times.
  let attempts = 0;
  while (textHash === recentHash && attempts < 3 && availablePassages.length > 1) {
    selectedPassage = availablePassages[Math.floor(Math.random() * availablePassages.length)];
    textHash = crypto.createHash('sha256').update(selectedPassage.text).digest('hex');
    attempts++;
  }

  const actualWordCount = selectedPassage.text.trim().split(/\s+/).length;

  // 4. Save to history
  try {
    await GuestTypingSession.create({
      sessionId,
      testId,
      duration,
      textHash,
      wordCount: actualWordCount,
      topic: selectedPassage.topic
    });
  } catch (dbError) {
    console.error('[GuestTyping] Failed to save guest session:', dbError.message);
  }

  return {
    testId,
    duration,
    text: selectedPassage.text,
    wordCount: actualWordCount,
    topic: selectedPassage.topic
  };
};
