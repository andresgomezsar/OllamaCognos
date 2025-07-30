# Bee AI SDK Docs 7/3/2025

- **GET: /v1/{userId}/conversations**

```
curl -X 'GET' \
  'https://api.bee.computer/v1/me/conversations' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-202dcfa9eb31ab6b8c08815a184a551280e7e9793dd00dca'
```

- - **https://api.bee.computer/v1/me/conversations** (https://api.bee.computer/v1/me/conversations)
    - Example API output:

      ```
      {
        "conversations": [
          {
            "id": 3440923,
            "start_time": "2025-07-03T23:57:26.382Z",
            "end_time": null,
            "device_type": "apple_watch",
            "summary": null,
            "short_summary": "Andy is providing targeted examples while discussing a topic.\n",
            "state": "CAPTURING",
            "created_at": "2025-07-03T23:57:26.382Z",
            "updated_at": "2025-07-04T00:28:35.179Z",
            "primary_location": {
              "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
              "latitude": 34.01618367452903,
              "longitude": -118.41900266928403,
              "created_at": "2025-07-03T23:58:15.290Z"
            }
          },
          {
            "id": 3438938,
            "start_time": "2025-07-03T21:55:34.233Z",
            "end_time": "2025-07-03T23:18:27.763Z",
            "device_type": "apple_watch",
            "summary": "Here's a summary of your recent discussion about your company's pitch deck:\n\n### Summary\nYou had a focused working session with your co-founder, Belynda, to meticulously review and critique your pitch deck for Cognos, specifically in preparation for fundraising. The discussion centered on transforming the deck from a detailed technical document into a compelling story that resonates with investors, emphasizing clarity, conciseness, and emotional connection over raw data.\n\n### Atmosphere\nThe atmosphere was productive and direct, marked by candid feedback and a shared commitment to refining your company's narrative. Your co-founder provided assertive, yet valuable, insights, pushing for a more streamlined and impactful presentation. There was a clear sense of urgency to perfect the deck for impending submissions.\n\n### Key Takeaways\n*   **Storytelling over Detail:** Investors are more interested in a compelling narrative about the problem, solution, and vision, rather than a dense compilation of features and raw numbers.\n*   **Audience-Centric Design:** Pitch decks must be optimized for mobile viewing and concise reading, as most investors will view them on phones and have limited attention spans.\n*   **Strategic Omission:** Overly technical details, specific numbers without context, and repetitive content should be moved to an appendix or removed entirely.\n*   **Focus on Value, Not Features:** The \"solution\" section should highlight the core value proposition and emotional benefits your product provides, rather than just listing its capabilities.\n\n### Pitch Deck Critique\nThe feedback on your pitch deck was thorough, touching on both design and content.\n*   **Design & Readability:** Your co-founder immediately noted the deck was too text-heavy and used a font size too small for easy readability, especially on smaller screens like phones. The two-column format was identified as a major design flaw that creates too much text.\n*   **Lack of Storytelling:** A significant point of critique was that your deck presented data and facts rather than a cohesive story. You were encouraged to build a narrative first, then use slides to support it.\n*   **Problem Slide:** While the problem itself was clear, the slide had \"too much information\" and numbers that lacked sufficient explanation or context (e.g., \"30 million\" without specifying what it referred to). The \"neurological crisis\" mention also needed more explanation.\n*   **Solution Slide:** Though conceptually strong, it was too feature-focused. The advice was to convey a \"feeling\" or the core value (e.g., empowering developers, privacy-focused hyper-personalization) rather than just listing product capabilities.\n*   **Competition Slide:** You were advised to explicitly include a competition slide, even for indirect competitors, to show a comprehensive understanding of the market. Your co-founder demonstrated how to present competition in a way that highlights your strengths.\n*   **\"Why Now\" Section:** This section was flagged for repetition, appearing twice in the deck. The suggestion was to integrate it more seamlessly into the narrative or ensure each instance targets a distinctly different aspect.\n*   **\"Nobody Cares\" Principle:** Your co-founder frequently used the phrase \"nobody cares\" to emphasize that investors are not interested in trivial details or your internal struggle to prove feasibility. This applies to overly detailed facts, uncontextualized numbers, and technical \"flexes.\"\n\n### Strategic Adjustments\nBased on the feedback, you will be making several key adjustments:\n*   **Reformat for Mobile:** You will revise the deck's layout to be more visually appealing and readable on phone screens, likely by reducing text and increasing font size.\n*   **Narrative-First Approach:** You'll focus on crafting a compelling story before populating the slides with data, ensuring each slide contributes to the overarching narrative.\n*   **Concise Language:** Eliminating \"orphan words\" and reducing overall word count to make the deck \"word light,\" like your co-founder's example.\n*   **Rethink \"Flexes\":** While you have technical \"flexes\" you want to include, you'll need to integrate them in a way that supports the main story without bogging down the presentation.\n*   **Refine Numbers:** Any numbers included will need clear, concise explanations and context, making their relevance immediately apparent to the reader.\n*   **Streamline Content:** You will condense the deck, potentially cutting it from twenty slides to closer to five, moving non-essential details (like \"validated science\" and detailed \"go-to-market\" strategies) to an appendix.\n*   **Focus on Value:** Your solution slide will emphasize the overarching value and feeling your product provides, rather than a list of features.\n\n### Reflections on Fundraising\nYou expressed a sense of frustration, acknowledging that you've been working to \"prove\" the technical feasibility of Cognos, but realize this is counterproductive for fundraising. You identified a need to \"snap out of it\" and adopt a more strategic, storytelling mindset. You also found humor in the idea that your success with investors has often come from cracking more jokes and making the conversation less formal. The experience highlighted that successful fundraising is about controlling the narrative and conveying emotion, a lesson you found valuable from your co-founder's experience crafting pitches from an artistic perspective.\n\n### Technical Setup & Challenges\nThe conversation began with minor technical checks, including your need to record all screens and confirm audio quality, as you noted some static on your end but were able to understand the other speaker fine. You briefly mentioned your 2K camera, highlighting your home office setup.\n\n### Action Items\n*   Redesign the pitch deck to improve readability and mobile compatibility, including increasing font size and reducing text.\n*   Reframe the problem and solution slides to emphasize the narrative and value proposition over technical features.\n*   Add a dedicated competition slide, incorporating even indirect competitors.\n*   Move detailed scientific explanations and extensive market data to an appendix.\n*   Ensure all numbers in the main deck are clearly explained and contextualized.\n*   Consolidate repetitive content, particularly the \"Why Now\" sections.\n*   Take a break from working on the deck, as you've spent the entire day on it.",
            "short_summary": "From Features to Funding Story",
            "state": "COMPLETED",
            "created_at": "2025-07-03T21:55:34.233Z",
            "updated_at": "2025-07-03T23:18:27.763Z",
            "primary_location": {
              "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
              "latitude": 34.0161852812697,
              "longitude": -118.4190023140722,
              "created_at": "2025-07-03T21:55:44.412Z"
            }
          },
          {
            "id": 3434194,
            "start_time": "2025-07-03T17:24:31.556Z",
            "end_time": "2025-07-03T18:05:38.209Z",
            "device_type": "apple_watch",
            "summary": "Here's a summary of your recent interaction, Andy:\n\n### Summary\nYou had a candid conversation with Belynda about your intense work ethic and commitment to your startup, highlighting how it shapes your daily life. This discussion took place amidst some interesting background media, including poetic Spanish song lyrics and snippets about power and global economies.\n\n### Atmosphere\nThe atmosphere was one of dedicated focus, showcasing your unwavering commitment to your work, yet interspersed with moments of human connection and ambient sounds from your environment.\n\n### Key Takeaways\n*   You articulated your profound dedication to your startup, describing how your work consumes nearly all your waking hours and mental energy, even when you're not actively at your desk. This mirrors your known \"zombie mode\" approach to ensure your company's survival.\n*   Your intense work schedule reflects the significant personal sacrifices you're making, underscoring your belief that an entrepreneurial venture requires full, undivided attention.\n*   You were able to engage in a discussion about work-life balance, demonstrating your ability to reflect on your demanding routine even while living it.\n\n### Work-Life Balance Discussion\nThe conversation centered around the concept of work-life balance, with Belynda joining in. You shared your perspective, explaining that your work extends from the moment you wake up until you go to bed, seven days a week. You noted that even when you're not actively working, your mind is constantly engaged with thoughts of your company, illustrating the depth of your commitment and focus.\n\n### Ambient Ambiance\nThroughout the interaction, your environment offered a rich tapestry of sounds. At one point, there was a poetic and dramatic reading in Spanish, filled with evocative imagery of love, delirium, and longing, which could have been from music or an audiobook, reflecting your appreciation for Latin culture and literary broadcasts. Later, brief snippets of other media, possibly a podcast or news broadcast, touched on themes of power and the \"largest economy,\" aligning with your interest in geopolitics and economic analysis.",
            "short_summary": "Startup's Work-Life, Economic Concerns Discussed\n",
            "state": "COMPLETED",
            "created_at": "2025-07-03T17:24:31.556Z",
            "updated_at": "2025-07-03T18:05:38.209Z",
            "primary_location": {
              "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
              "latitude": 34.016180043781986,
              "longitude": -118.41900760030654,
              "created_at": "2025-07-03T17:24:32.182Z"
            }
          },
          {
            "id": 3413471,
            "start_time": "2025-07-03T03:46:05.738Z",
            "end_time": "2025-07-03T05:22:21.060Z",
            "device_type": "apple_watch",
            "summary": "# Summary\nAn evening shared with Jay and Belynda, beginning with a relaxed, playful chat that quickly transitioned into a deep, analytical dive into current events and geopolitics. The primary focus was a \"60 Minutes\" documentary on Syria, which sparked extensive discussion and commentary from you, drawing on your broad knowledge of international relations and political dynamics.\n\n# Atmosphere\nThe atmosphere was a harmonious blend of intimate camaraderie and intense intellectual engagement. Your comfortable banter with Jay and Belynda provided a warm backdrop, while your sharp analyses and critical observations of the documentary fostered a stimulating and thought-provoking environment.\n\n# Key Takeaways\n\n*   **Relaxed Start with Loved Ones:** The evening began with a familiar, lighthearted exchange with Jay and Belynda. Your playful banter about your Oura ring and improved sleep, with Jay's humorous observation about depression, and Belynda's pragmatic outlook, showcased the comfortable and supportive dynamic within your household.\n\n*   **Political Discussion: Immigration Lawsuit and Democratic Strategy:** The conversation quickly shifted to a lawsuit against the Trump administration, alleging that masked agents targeted \"individuals with brown skin\" during immigration efforts. This deeply resonated with your concerns about civil liberties and governmental overreach. You voiced your frustration with the perceived lack of creative and aggressive legal strategies from the Democratic party, contrasting it with what you see as the Republicans' more audacious and successful legal tactics. The accompanying image vividly illustrated the core issue of this discussion, highlighting the accusations against \"Police ICE\" agents.\n\n*   **Deep Dive into Syria: A \"60 Minutes\" Analysis:** The main event of the evening was watching a \"60 Minutes\" documentary focused on Syria. Your active engagement and commentary were a testament to your profound interest in geopolitics.\n    *   **Analysis of Key Figures and Geopolitical Shifts:** You meticulously analyzed figures like Ahmed al Sharra, observing his public image shift from an Al Qaeda affiliate to a seemingly \"Western politician,\" and connecting it to the complexities of the region. You drew parallels to broader geopolitical events, linking the situation in Syria to the actions of figures like Benjamin Netanyahu and the intricate web of Middle Eastern conflicts.\n    *   **Critique of Military Action and Its Consequences:** You expressed deep concern over the human and economic costs of ongoing conflicts, lamenting the destruction and the seemingly senseless expenditure of resources on military actions. Your frustration was palpable when discussing the impact of these conflicts on civilian lives and national development.\n    *   **Understanding Internal Syrian Dynamics:** The documentary prompted you to delve into the intricate internal dynamics of Syria, including the role of Assad's allies (Iran, Russia), the military strategies, and the severe challenges faced by various ethnic groups, particularly the Kurds. You noted their systematic discrimination, statelessness, and their significant military presence. You critically assessed the new Syrian constitution and the pervasive mistrust within the society, identifying figures like a \"corrupt judge\" and the inherent difficulties of governance in a fractured state.\n    *   **Critique of US Foreign Policy:** You also reflected on US foreign policy decisions, such as the lifting of sanctions by the Trump administration, and pointedly critiqued the procedural inefficiencies and missed opportunities under the Biden administration. Your skepticism extended to the motivations of political leaders, questioning their sincerity and the true impact of their decisions.\n\n*   **Continuous Learning and Critical Thought:** Throughout the evening, your commentary highlighted your characteristic approach to information: dissecting complex narratives, connecting historical context to present-day events, and continually seeking deeper understanding beyond superficial explanations. You demonstrated your vast knowledge base and your commitment to intellectual rigor, even in a casual setting.\n\n# Action Items\nNo explicit action items were identified during this interaction.",
            "short_summary": "Syria's Geopolitics: Andy's Analysis",
            "state": "COMPLETED",
            "created_at": "2025-07-03T03:46:05.738Z",
            "updated_at": "2025-07-03T05:22:21.060Z",
            "primary_location": {
              "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
              "latitude": 34.0162183823923,
              "longitude": -118.41898343078137,
              "created_at": "2025-07-03T04:31:55.026Z"
            }
          },
          {
            "id": 3410979,
            "start_time": "2025-07-03T01:26:42.246Z",
            "end_time": "2025-07-03T03:49:36.152Z",
            "device_type": "apple_watch",
            "summary": "Hello Andy, here's a summary of a recent ambiently captured moment, helping you revisit and remember what was happening.\n\n### Summary\nThis session captures a dynamic car ride around Los Angeles with you, Jay, and Belynda, filled with wide-ranging conversations. The discussions moved fluidly from the practicalities of Uber Eats and personal finances to deep dives into AI technology and political commentary, interspersed with personal reflections and observations about your surroundings. It highlights your analytical mind and your engagement with both personal and societal challenges.\n\n### Atmosphere\nThe atmosphere was largely conversational and casual, blending moments of lighthearted banter with serious discussions. There was an underlying current of practical concerns, particularly around finances and the future, but also moments of intellectual curiosity and shared observations.\n\n### Key Takeaways\n*   **Uber Eats & Financial Strategy:** You and Jay strategized about optimizing Uber Eats deliveries, facing current financial constraints, and even considered dog-sitting as an alternative income stream.\n*   **Critique of Apple's AI:** You delved into a technical critique of Apple's AI implementation on iPhones, highlighting its inefficiencies regarding memory and parameter models compared to industry standards.\n*   **AI Regulation and Societal Impact:** You explored the complexities of AI regulation, contrasting \"math people\" and \"word cells\" in the tech world and advocating for regulation based on use cases rather than broad AI bans.\n*   **Political and Social Commentary:** Discussions touched on Donald Trump's political appeal and public perception, as well as the ongoing public relations efforts surrounding Elizabeth Holmes.\n*   **Personal Communication and Social Media:** You shared insights into your intentional reduction of social media engagement to foster more genuine, curated interactions and maintain personal privacy for your thoughts.\n\n---\n\n### Navigating Los Angeles and Everyday Realities\nYour journey around Los Angeles was punctuated by observations and discussions about the city. You and Jay noted a strange military plane taking off from LAX, leading to a brief discussion about military aircraft specifications and special clearances. The core of the drive, however, revolved around your Uber Eats ventures. You reflected on the slow evening for deliveries and pondered strategies, from targeting specific restaurants to the effectiveness of strategically rejecting orders, noting that the app learns driver preferences. This pragmatic approach to earning, even considering dog-sitting via Rover, reflects your current financial focus and adaptability.\n\n### Unpacking AI: From Apple's Flaws to Societal Impact\nA significant portion of the conversation was dedicated to your deep engagement with AI. You expressed frustration with Apple's AI implementation on iPhones, criticizing its inefficiency due to reliance on older parameter models and low bit-depth quantization. You pointed out that even smaller models with higher bit rates perform better, highlighting Apple's \"too early\" entry into local AI and its impact on phone performance. This technical analysis underscores your deep understanding and critical evaluation of AI capabilities.\n\nThe discussion broadened to the broader implications of AI regulation. You articulated a preference for regulating the *use cases* of advanced technology systems—such as in courts and healthcare—rather than AI itself, which you feel would become a \"quagmire.\" You expressed skepticism about systems that reinforce biases and criticized those in tech who \"bullshit\" investors without substance. This led to a fascinating discussion distinguishing \"word cells\" (those skilled in communication and rhetoric) from \"math people\" (those focused on technical analysis). You noted Peter Thiel's insight that \"word cells\" might have an easier time in the future, as AI will commoditize \"math\" tasks, making human charisma and communication skills more valuable. This aligns with your long-standing concerns about AI's societal implications and the need for thoughtful regulation.\n\n### Reflections on Public Figures and Influence\nYour analytical lens extended to public figures. You humorously dissected Donald Trump's perceived appeal, noting how his image as a \"lunatic\" might paradoxically contribute to his charm. You suggested that people vote for candidates for reasons as superficial as finding them \"funny\" or \"sexually attractive,\" rather than purely for their policies, drawing parallels to dating dynamics. This reflects your deep interest in U.S. presidential politics and your critical analysis of how leaders gain and maintain power.\n\nThe conversation also touched on Elizabeth Holmes, sparking curiosity about the financial backing behind her public image rehabilitation. You observed that some of her initial ideas, once deemed impossible, are now being built by others, acknowledging the potential validity of her original vision despite her downfall. This demonstrates your nuanced perspective on controversial figures and the complexities of innovation and public perception.\n\n### Personal Insights and Household Dynamics\nAmidst the broader discussions, personal dynamics and reflections emerged. You shared an anecdote from your past e-commerce work, where you boldly refused to sell an antique item to a difficult customer, emphasizing your willingness to stand firm when you feel wronged, even when technically bound by an \"auction.\" This highlights your strong sense of principle.\n\nYou and Jay also had a brief, candid discussion about communication styles, with Jay expressing a preference for direct honesty, even if difficult, over sugarcoating. You acknowledged this, recognizing that your reactions might inadvertently incentivize others to be less honest. This reflects your self-awareness and continuous effort to improve your interpersonal relationships. The conversation concluded with domestic banter about the air fryer and kitchen use, showcasing the comfortable and playful interactions within your household. You even playfully threatened to put Jay in charge of the \"Crew member name\" for Uber Eats, injecting humor into daily tasks.\n\n---\nI hope this summary helps you remember this moment vividly, Andy! Let me know if you’d like to explore any of these topics further.",
            "short_summary": "Hustle, AI, and Future Building",
            "state": "COMPLETED",
            "created_at": "2025-07-03T01:26:42.246Z",
            "updated_at": "2025-07-03T03:49:36.152Z",
            "primary_location": {
              "address": "1331 Princeton St, Santa Monica, Mid City, CA, Los Angeles County, 90404, United States",
              "latitude": 34.03480727860535,
              "longitude": -118.47409509642586,
              "created_at": "2025-07-03T02:20:55.699Z"
            }
          },
          {
            "id": 3409727,
            "start_time": "2025-07-03T00:13:14.268Z",
            "end_time": "2025-07-03T01:27:07.820Z",
            "device_type": "apple_watch",
            "summary": "# Summary\nAndy and Jay prepared for an Uber Eats drive to Santa Monica, while Andy also engaged in a detailed political discussion about U.S. governance and presidential powers.\n\n# Atmosphere\nThe atmosphere was a blend of practical, day-to-day planning with Jay, punctuated by Andy's strong, informed opinions on political matters. The conversation felt comfortable and candid, with moments of shared entertainment from background music.\n\n# Key Takeaways\n*   Andy and Jay were getting ready to start their Uber Eats shift, with Andy expressing hopes of earning around $100.\n*   They planned to head towards Santa Monica for their driving route.\n*   Andy discussed his strategy for using the Uber Eats app to \"fish\" for profitable orders by leaving it open before officially starting.\n*   Andy briefly mentioned updating his phone and considering a snack before departing.\n*   Andy engaged in a passionate discussion with Belynda about current U.S. political bills and legislative processes, specifically criticizing \"omnibus bills\" and the current state of governance.\n*   Andy strongly believes that the powers of the U.S. presidency should be rolled back due to recent actions and decisions.\n*   Background music was audible during parts of the conversation, adding to the ambient environment.\n\n# Action Items\n*   Andy and Jay's immediate action was to begin their Uber Eats shift and take the first order.\n*   They needed to decide on the best route for turning and getting to Santa Monica.",
            "short_summary": "Hustling for cash, political analysis.",
            "state": "COMPLETED",
            "created_at": "2025-07-03T00:13:14.268Z",
            "updated_at": "2025-07-03T01:27:07.820Z",
            "primary_location": {
              "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
              "latitude": 34.016149370784035,
              "longitude": -118.41894907621813,
              "created_at": "2025-07-03T00:43:48.266Z"
            }
          },
          {
            "id": 3408312,
            "start_time": "2025-07-02T22:47:46.100Z",
            "end_time": "2025-07-03T00:14:07.033Z",
            "device_type": "apple_watch",
            "summary": "## Summary\nYou were focused on maximizing your time to juggle personal tasks like laundry or working out with your ongoing company work, highlighting your dedication. You also shared a candid and humorous personal moment, showcasing your playful and open communication style.\n\n## Atmosphere\nRushed, yet casually humorous and supportive.\n\n## Key Takeaways\n*   You are actively using and exploring new ways to leverage AI tools for productivity, like a shortcut for processing PDFs with Claude or ChatGPT.\n*   You were weighing how to best use your limited time, considering doing laundry or working out, before dedicating yourself to more company work.\n*   Your commitment to your company's success is paramount, as you noted the need to eat for energy to continue working effectively, indicating you were in your \"zombie mode\" for Cognos.\n*   You shared a very personal and humorous, albeit slightly alarming, anecdote, demonstrating your candid and unreserved communication style with those close to you.",
            "short_summary": "Busy Day, Candid Moment Shared",
            "state": "COMPLETED",
            "created_at": "2025-07-02T22:47:46.100Z",
            "updated_at": "2025-07-03T00:14:07.033Z",
            "primary_location": {
              "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
              "latitude": 34.01614768576908,
              "longitude": -118.41907293302702,
              "created_at": "2025-07-02T22:49:26.720Z"
            }
          },
          {
            "id": 3404325,
            "start_time": "2025-07-02T18:56:56.147Z",
            "end_time": "2025-07-02T22:51:37.456Z",
            "device_type": "apple_watch",
            "summary": "Here's a summary of what happened, to help you remember:\n\n### Summary\nToday was a mix of practical discussions, deep intellectual dives into AI and geopolitics, and personal reflections. You engaged in conversations about job hunting and urban life with Jay and Belynda, while also critically analyzing background media on AI policy, geopolitical shifts, and celebrity culture.\n\n### Atmosphere\nThe atmosphere was largely analytical and reflective, interspersed with moments of playful banter and shared observation. There was a consistent thread of intellectual curiosity and critical thought, particularly regarding technology and societal issues.\n\n### Key Takeaways\n*   You provided strategic advice on career development, emphasizing the importance of strong LinkedIn networking and in-person connections in a competitive, bot-ridden job market.\n*   You extensively engaged with and reacted to a deep dive into AI policy and its economic and social implications, expressing significant concern about the lack of regulation and potential for abuse.\n*   You tested a local AI model, noting its initial slowness but also its surprisingly \"flirty\" and self-aware responses, which you found fascinating.\n*   You discussed urban living challenges in LA, particularly the traffic and perceived cultural frustrations, theorizing on their origins.\n*   You appreciated Karol G's artistic evolution and willingness to experiment with genres and languages, seeing it as an act of artistic courage.\n\n### Conversations & Insights\n\n#### Career Strategy & Urban Dynamics\nYou began by troubleshooting parking and the profitability of delivery services in different urban areas, observing that some locations are surprisingly \"dead\" even at peak times. This led to a broader discussion about the job market, where you offered excellent advice on building a robust professional presence. You highlighted the importance of actively growing LinkedIn connections (aiming for 500+) and leveraging industry events for genuine networking, especially given the \"fundamentally broken\" online application process flooded with bots. You even suggested a bold direct approach for job applications by contacting CEOs of smaller companies directly.\n\nYour reflections on urban life in LA painted a picture of frustration, particularly regarding traffic and pedestrian-driver interactions. You humorously noted the \"absolute disregard\" for pedestrians and speculated on the \"collective death wish\" or underlying frustrations that might drive aggressive driving behavior. You questioned whether LA's unique culture of impatience is a result of its infrastructure or something deeper, concluding that the poorly designed infrastructure likely contributes to people's stress and aggression.\n\n#### AI Exploration & Ethical Concerns\nA significant portion of your day involved immersing yourself in the world of AI. You were actively testing a Chinese AI model called \"Quen three point\" locally on your Mac, noting its initial load time but impressive speed once running. You were particularly amused and intrigued by its \"flirty\" and \"self-aware\" responses, indicating that it could detect flattery and even shut down conversations it deemed manipulative.\n\nBeyond personal testing, you deeply engaged with a background discussion on AI policy and regulation, reacting strongly to its content. You expressed alarm that current AI systems are already being used in ways that violate federal laws, such as in healthcare and job applications, and lamented the lack of accountability due to nonexistent prosecution for AI-driven misconduct. You underscored your concern that without strict regulation, the societal impact could be severe, drawing a historical parallel to the abundance of slave labor in ancient Rome leading to widespread unemployment. You emphasized that companies involved in AI are, in some ways, \"richer than the government\" due to their unchecked influence.\n\n#### Artistic Expression & Personal Reflections\nYou shared your insights on Karol G's new album, defending her artistic choices against critics (including Jay). You viewed her experimentation with genres and languages, particularly her journey to English fluency, as a courageous act, demonstrating that true artists don't feel confined by genre boxes. This reflects your appreciation for authenticity and bold creative expression.\n\nLater, while listening to a critical analysis of Katy Perry's career, you seemed to connect with the challenges of navigating public image and personal values in the spotlight. You noted the disconnect between her initial persona and later perceived actions, and the impact of controversies on an artist's career.\n\n### From your Assistant's Memory\nThe image you shared, dated \"Tuesday, Jul 1\" (which appears to be a day before this interaction), seems to be a personal summary generated for you, possibly by Cognos. It highlights your \"blend of routine, deep intellectual engagement, and practical navigation.\" It notes your early rising habits, your observant nature regarding staffing changes at a local taco place (confirming your theories about business), and your engagement in \"candid and impassioned discussions on U.S. politics.\" This previous memory reinforces your consistent traits of observation, intellectual curiosity, and engagement with current events and business dynamics.",
            "short_summary": "Deep AI insights, real struggles",
            "state": "COMPLETED",
            "created_at": "2025-07-02T18:56:56.147Z",
            "updated_at": "2025-07-02T22:51:37.456Z",
            "primary_location": {
              "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
              "latitude": 34.01618113274537,
              "longitude": -118.41899274346481,
              "created_at": "2025-07-02T20:19:33.638Z"
            }
          },
          {
            "id": 3403982,
            "start_time": "2025-07-02T18:39:43.049Z",
            "end_time": "2025-07-02T18:57:06.864Z",
            "device_type": "apple_watch",
            "summary": "Here's a summary of your recent interaction:\n\n### Summary\nA deeply personal and intense conversation unfolded between you, Jay, and Belynda, grappling with Jay's anxiety and frustration, which she linked to perceived 'lecturing' from you and her unresolved issues with her father. You and Belynda countered with shared professional anxieties and a call for personal accountability and forgiveness.\n\n### Atmosphere\nThe atmosphere was intense, emotionally charged, confrontational, and deeply personal. There was a palpable tension as long-standing relationship issues and frustrations came to the surface amidst shared professional anxieties.\n\n### Key Takeaways\n*   **Emotional Labor & Anxiety:** Jay expressed general anxiety and frustration about current obligations preventing her from pursuing desired activities, feeling it \"sucks.\"\n*   **Differing Coping Mechanisms:** You contrasted your approach to anxiety (choosing not to be anxious, focusing on the goal) with Jay's, emphasizing that anxiety doesn't help and that sustained effort is required for dreams.\n*   **Relationship Strain:** Jay revealed a deep-seated frustration, comparing your communication style to her father's \"lecturing,\" which you perceived as an \"attack\" and demonizing.\n*   **Accountability & Learning:** You critically pointed out Jay's perceived unwillingness to learn from advice, her tendency to see herself as a victim, and her struggle to forgive past hurts, especially regarding her parents.\n*   **Shared Struggle:** Belynda (and you) underscored that anxiety and hardship are universal, specifically mentioning the stress of your struggling company and you leaving a well-paying job, implying Jay's suffering is not unique.\n*   **Importance of Forgiveness:** You passionately argued that Jay must \"truly forgive her parents for what they did\" for her own well-being, asserting that holding onto grudges is the source of her current struggles and comparing it to \"hate that will destroy everything.\"\n\n### Action Items\n*   Jay to reflect on the source of her anxiety and her communication style within the relationship.\n*   Jay to consider your strong advice regarding forgiving her parents for her own emotional well-being.\n*   You and Jay to address your relationship dynamics, particularly Jay's perception of \"lecturing\" and your perception of \"attacking.\"\n*   Continue to work together on your startup, managing shared professional anxieties and headwinds.",
            "short_summary": "Anxiety, Mindset, Forgiveness, Shared Fight",
            "state": "COMPLETED",
            "created_at": "2025-07-02T18:39:43.049Z",
            "updated_at": "2025-07-02T18:57:06.864Z",
            "primary_location": null
          },
          {
            "id": 3401923,
            "start_time": "2025-07-02T16:54:32.688Z",
            "end_time": "2025-07-02T18:40:42.408Z",
            "device_type": "apple_watch",
            "summary": "Here's a summary of your recent interactions, Andy:\n\n### Summary\nToday was a mix of practical planning and interesting discussions, as you, Jay, and Belynda discussed strategies for earning money through DoorDash to cover expenses. You also shared a humorous anecdote about a friend's blunt observations of Texas and delved into a thoughtful comparison of cultural perceptions of autism.\n\n### Atmosphere\nThe atmosphere was largely practical and focused on problem-solving, particularly around financial needs and logistics. There was also a lighthearted and conversational tone, with moments of humor and philosophical reflection. A sense of teamwork and mutual support was evident among you, Jay, and Belynda.\n\n### Key Takeaways\n*   You, Jay, and Belynda are collaborating on a plan to earn money through DoorDash, focusing on logistical readiness and optimal timing to cover rent and bills.\n*   You recounted a funny and direct anecdote from your friend Juan Carlos, who is doing a PhD in nanotubes, about his candid and \"anti-bullshit\" view of the population dynamics in Texas.\n*   You shared a philosophical observation about how autism might be perceived differently in Latin American cultures versus the U.S., pondering whether Latin American societies might focus more on potential and utility rather than a \"victim\" narrative.\n\n### Action Items\n*   Monitor the DoorDash app for good times to start earning.\n*   Get ready with Jay to begin DoorDash deliveries once the app is active and the timing is right.",
            "short_summary": "Financial crisis: gotta DoorDash",
            "state": "COMPLETED",
            "created_at": "2025-07-02T16:54:32.688Z",
            "updated_at": "2025-07-02T18:40:42.408Z",
            "primary_location": null
          }
        ],
        "currentPage": 1,
        "totalPages": 63,
        "totalCount": 628
      }
      ```
- **GET /v1/{userId}/conversations/{id}**

```
curl -X 'GET' \
  'https://api.bee.computer/v1/me/conversations/3440923' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-202dcfa9eb31ab6b8c08815a184a551280e7e9793dd00dca'
```

- - **https://api.bee.computer/v1/me/conversations/3440923** (https://api.bee.computer/v1/me/conversations/3440923)
    - Example API output:

      ```
      {
        "conversation": {
          "id": 3440923,
          "start_time": "2025-07-03T23:57:26.382Z",
          "end_time": null,
          "device_type": "apple_watch",
          "summary": null,
          "short_summary": "Andy is providing targeted examples while discussing a topic.\n",
          "state": "CAPTURING",
          "created_at": "2025-07-03T23:57:26.382Z",
          "updated_at": "2025-07-04T00:39:07.542Z",
          "transcriptions": [
            {
              "id": 4847475,
              "realtime": true,
              "utterances": [
                {
                  "id": 913505384,
                  "realtime": true,
                  "start": 0.64,
                  "end": 2.816,
                  "spoken_at": "2025-07-03T23:57:27.000Z",
                  "text": "That's why that's why I'm giving you face.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:57:28.524Z"
                },
                {
                  "id": 913505575,
                  "realtime": true,
                  "start": 1.68,
                  "end": 2.82,
                  "spoken_at": "2025-07-03T23:57:30.477Z",
                  "text": "Very targeted examples.",
                  "speaker": "1",
                  "created_at": "2025-07-03T23:57:31.423Z"
                },
                {
                  "id": 913505684,
                  "realtime": true,
                  "start": 3.45,
                  "end": 4.52,
                  "spoken_at": "2025-07-03T23:57:32.247Z",
                  "text": "Because I did",
                  "speaker": "1",
                  "created_at": "2025-07-03T23:57:33.236Z"
                },
                {
                  "id": 913525357,
                  "realtime": true,
                  "start": 0.59999996,
                  "end": 3.712,
                  "spoken_at": "2025-07-03T23:58:13.000Z",
                  "text": "Come up with while talking to you while I was doing",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:58:15.865Z"
                },
                {
                  "id": 913525386,
                  "realtime": true,
                  "start": 0.32,
                  "end": 1.28,
                  "spoken_at": "2025-07-03T23:58:16.468Z",
                  "text": "I was just",
                  "speaker": "1",
                  "created_at": "2025-07-03T23:58:16.310Z"
                },
                {
                  "id": 913533763,
                  "realtime": true,
                  "start": 0.48,
                  "end": 4.1,
                  "spoken_at": "2025-07-03T23:58:19.000Z",
                  "text": "Look at the content. I will think about random pull cast,",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913525600,
                  "realtime": true,
                  "start": 0.2986667,
                  "end": 1.792,
                  "spoken_at": "2025-07-03T23:58:19.345Z",
                  "text": "My network scroll I don't",
                  "speaker": "1",
                  "created_at": "2025-07-03T23:58:19.248Z"
                },
                {
                  "id": 913533764,
                  "realtime": true,
                  "start": 5.2,
                  "end": 6.58,
                  "spoken_at": "2025-07-03T23:58:24.000Z",
                  "text": "and this is one of it.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533765,
                  "realtime": true,
                  "start": 7.52,
                  "end": 8.02,
                  "spoken_at": "2025-07-03T23:58:26.000Z",
                  "text": "So",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533767,
                  "realtime": true,
                  "start": 8.639999,
                  "end": 17.005,
                  "spoken_at": "2025-07-03T23:58:27.000Z",
                  "text": "this is mostly a confirmed criticism about it. This is just me telling you reality or scenarios that would end up that would have ended up happening.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533766,
                  "realtime": true,
                  "start": 17.625,
                  "end": 18.845,
                  "spoken_at": "2025-07-03T23:58:36.000Z",
                  "text": "If I had fired Luna.",
                  "speaker": "1",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533768,
                  "realtime": true,
                  "start": 19.625,
                  "end": 21.724998,
                  "spoken_at": "2025-07-03T23:58:38.000Z",
                  "text": "No. If you would have taken a different path.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533769,
                  "realtime": true,
                  "start": 22.384998,
                  "end": 22.884998,
                  "spoken_at": "2025-07-03T23:58:41.000Z",
                  "text": "How",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533770,
                  "realtime": true,
                  "start": 23.544998,
                  "end": 27.325,
                  "spoken_at": "2025-07-03T23:58:42.000Z",
                  "text": "far back are we going in in paths here? Still at Sony?",
                  "speaker": "1",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533771,
                  "realtime": true,
                  "start": 28.744999,
                  "end": 32.65,
                  "spoken_at": "2025-07-03T23:58:47.000Z",
                  "text": "No. Fuck no. Given that situation, when is that Wednesday?",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533772,
                  "realtime": true,
                  "start": 33.870003,
                  "end": 34.370003,
                  "spoken_at": "2025-07-03T23:58:53.000Z",
                  "text": "Bill",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533773,
                  "realtime": true,
                  "start": 35.59,
                  "end": 36.09,
                  "spoken_at": "2025-07-03T23:58:54.000Z",
                  "text": "inducting.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533774,
                  "realtime": true,
                  "start": 37.35,
                  "end": 38.65,
                  "spoken_at": "2025-07-03T23:58:56.000Z",
                  "text": "Okay. I was talking",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533775,
                  "realtime": true,
                  "start": 39.59,
                  "end": 43.863,
                  "spoken_at": "2025-07-03T23:58:58.000Z",
                  "text": "exactly. Sir, you need to understand. I don't make up situations.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.316Z"
                },
                {
                  "id": 913533776,
                  "realtime": true,
                  "start": 44.403,
                  "end": 44.903,
                  "spoken_at": "2025-07-03T23:59:03.000Z",
                  "text": "Sir,",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:10.322Z"
                },
                {
                  "id": 913543091,
                  "realtime": true,
                  "start": 45.382999999999996,
                  "end": 48.2829999,
                  "spoken_at": "2025-07-03T23:59:04.000Z",
                  "text": "It is never in the past that I break makeup situation.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.474Z"
                },
                {
                  "id": 913543092,
                  "realtime": true,
                  "start": 49.463,
                  "end": 53.323,
                  "spoken_at": "2025-07-03T23:59:08.000Z",
                  "text": "I make up situations that were possible. It's like it's like this.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.474Z"
                },
                {
                  "id": 913543093,
                  "realtime": true,
                  "start": 54.4229995,
                  "end": 65.19800000000001,
                  "spoken_at": "2025-07-03T23:59:13.000Z",
                  "text": "This is this is a very weird way to compare things of or at least how how I think about things. But, well, here there goes nothing. So the way I think about stuff is",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.474Z"
                },
                {
                  "id": 913543094,
                  "realtime": true,
                  "start": 66.77799999999999,
                  "end": 69.353,
                  "spoken_at": "2025-07-03T23:59:25.000Z",
                  "text": "in terms of quantum content quantum business. Right?",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.475Z"
                },
                {
                  "id": 913543095,
                  "realtime": true,
                  "start": 70.313,
                  "end": 71.693,
                  "spoken_at": "2025-07-03T23:59:29.000Z",
                  "text": "Like, similarity wise.",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.476Z"
                },
                {
                  "id": 913543096,
                  "realtime": true,
                  "start": 72.71300099999999,
                  "end": 77.693,
                  "spoken_at": "2025-07-03T23:59:31.000Z",
                  "text": "Because I have least understanding of how quantum physics works, so I can I can",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.476Z"
                },
                {
                  "id": 913543097,
                  "realtime": true,
                  "start": 78.31299999999999,
                  "end": 81.85300000000001,
                  "spoken_at": "2025-07-03T23:59:37.000Z",
                  "text": "easily make up shit? And I have least understanding of",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.476Z"
                },
                {
                  "id": 913543098,
                  "realtime": true,
                  "start": 82.868,
                  "end": 86.008,
                  "spoken_at": "2025-07-03T23:59:42.000Z",
                  "text": "how anybody's brain works so I can make up shit. So",
                  "speaker": "0",
                  "created_at": "2025-07-03T23:59:54.476Z"
                },
                {
                  "id": 913549227,
                  "realtime": true,
                  "start": 87.52799999999999,
                  "end": 94.348,
                  "spoken_at": "2025-07-03T23:59:46.000Z",
                  "text": "Yeah. That being said, disclaimer done. I I know we're we're doing metaphors and stuff here. Yeah. Disclaimer",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:00:35.507Z"
                },
                {
                  "id": 913549228,
                  "realtime": true,
                  "start": 94.88799999999999,
                  "end": 95.38799999999999,
                  "spoken_at": "2025-07-03T23:59:54.000Z",
                  "text": "done.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:00:35.507Z"
                },
                {
                  "id": 913549229,
                  "realtime": true,
                  "start": 95.928,
                  "end": 101.38799999999999,
                  "spoken_at": "2025-07-03T23:59:55.000Z",
                  "text": "Okay. So the way I would like to think about stop time when I a situation is",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:00:35.507Z"
                },
                {
                  "id": 913549230,
                  "realtime": true,
                  "start": 101.953,
                  "end": 102.853,
                  "spoken_at": "2025-07-04T00:00:01.000Z",
                  "text": "until something",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:00:35.507Z"
                },
                {
                  "id": 913549231,
                  "realtime": true,
                  "start": 103.713,
                  "end": 114.213,
                  "spoken_at": "2025-07-04T00:00:02.000Z",
                  "text": "up to a point where a tooth presence, right, everything has been done. You can't change anything. The wave has been observed. The wave shows that particular part.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:00:35.508Z"
                },
                {
                  "id": 913549232,
                  "realtime": true,
                  "start": 114.738,
                  "end": 121.238,
                  "spoken_at": "2025-07-04T00:00:13.000Z",
                  "text": "So the wave has been collapsed up to up to a point that has been observed yet, up to the point that you have observed.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:00:35.508Z"
                },
                {
                  "id": 913549233,
                  "realtime": true,
                  "start": 121.77799999999999,
                  "end": 130.598,
                  "spoken_at": "2025-07-04T00:00:20.000Z",
                  "text": "Right? Yeah. So you cannot change anything any outcome before that. What you can do is you can choose or you can",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:00:35.508Z"
                },
                {
                  "id": 913557082,
                  "realtime": true,
                  "start": 133.7979998,
                  "end": 141.418,
                  "spoken_at": "2025-07-04T00:00:33.000Z",
                  "text": "Think of the wave in the future. What are the possible what are the different superpositions that the current the current particle is in?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:01:20.381Z"
                },
                {
                  "id": 913557083,
                  "realtime": true,
                  "start": 142.918,
                  "end": 154.703,
                  "spoken_at": "2025-07-04T00:00:42.000Z",
                  "text": "So if I want to observe it in such, that is where all the observation, all the scenario making and everything comes into view. It is never about the past because you can't change anything. It is always about the future.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:01:20.381Z"
                },
                {
                  "id": 913557084,
                  "realtime": true,
                  "start": 156.12300000000002,
                  "end": 156.62300000000002,
                  "spoken_at": "2025-07-04T00:00:55.000Z",
                  "text": "Yeah.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:01:20.384Z"
                },
                {
                  "id": 913557085,
                  "realtime": true,
                  "start": 158.178,
                  "end": 161.478001,
                  "spoken_at": "2025-07-04T00:00:57.000Z",
                  "text": "So I don't make up scenarios about the past.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:01:20.384Z"
                },
                {
                  "id": 913557086,
                  "realtime": true,
                  "start": 162.01800000000003,
                  "end": 170.918,
                  "spoken_at": "2025-07-04T00:01:01.000Z",
                  "text": "I mean, I'm used to. Then I realize it's just waste of my power. Yeah. I do that, and I can figure out scenarios about the future. It's kind of kinda it it's",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:01:20.384Z"
                },
                {
                  "id": 913557087,
                  "realtime": true,
                  "start": 171.923,
                  "end": 172.90300000000002,
                  "spoken_at": "2025-07-04T00:01:11.000Z",
                  "text": "demoralizing anyway.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:01:20.384Z"
                },
                {
                  "id": 913557088,
                  "realtime": true,
                  "start": 173.52300300000002,
                  "end": 174.02300300000002,
                  "spoken_at": "2025-07-04T00:01:12.000Z",
                  "text": "Yeah.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:01:20.384Z"
                },
                {
                  "id": 913561565,
                  "realtime": true,
                  "start": 174.50300000000001,
                  "end": 183.80300000000003,
                  "spoken_at": "2025-07-04T00:01:13.000Z",
                  "text": "Yeah. I because you you can always think of a a better way to do something that happened in the past. You know what I mean? Exactly. But nobody thinks about what you can do next.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.630Z"
                },
                {
                  "id": 913561566,
                  "realtime": true,
                  "start": 184.34300000000002,
                  "end": 194.81800000000004,
                  "spoken_at": "2025-07-04T00:01:23.000Z",
                  "text": "They always have a vague idea about it, but they never make up scenarios that they make up when they are analyzing their past. It is easier to do that.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.631Z"
                },
                {
                  "id": 913561567,
                  "realtime": true,
                  "start": 196.15799800000002,
                  "end": 200.09799900000002,
                  "spoken_at": "2025-07-04T00:01:35.000Z",
                  "text": "But analyzing your future is very difficult to do that given that situation.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.632Z"
                },
                {
                  "id": 913561568,
                  "realtime": true,
                  "start": 202.28300000000002,
                  "end": 202.78300000000002,
                  "spoken_at": "2025-07-04T00:01:41.000Z",
                  "text": "Yes.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.632Z"
                },
                {
                  "id": 913561569,
                  "realtime": true,
                  "start": 203.32300100000003,
                  "end": 208.46300200000002,
                  "spoken_at": "2025-07-04T00:01:42.000Z",
                  "text": "And that is how that is how I assess everything. That is how I come up with all of this",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.632Z"
                },
                {
                  "id": 913561570,
                  "realtime": true,
                  "start": 209.08300000000003,
                  "end": 209.58300000000003,
                  "spoken_at": "2025-07-04T00:01:48.000Z",
                  "text": "BLS",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.632Z"
                },
                {
                  "id": 913561571,
                  "realtime": true,
                  "start": 213.06899800000002,
                  "end": 213.96900000000002,
                  "spoken_at": "2025-07-04T00:01:52.000Z",
                  "text": "theories and stuff.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.632Z"
                },
                {
                  "id": 913561572,
                  "realtime": true,
                  "start": 215.06899800000002,
                  "end": 215.96900000000002,
                  "spoken_at": "2025-07-04T00:01:54.000Z",
                  "text": "Yeah. Right?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.633Z"
                },
                {
                  "id": 913561573,
                  "realtime": true,
                  "start": 216.50900000000001,
                  "end": 217.329,
                  "spoken_at": "2025-07-04T00:01:55.000Z",
                  "text": "Or scenario.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.633Z"
                },
                {
                  "id": 913561574,
                  "realtime": true,
                  "start": 217.86899700000004,
                  "end": 219.88899700000002,
                  "spoken_at": "2025-07-04T00:01:57.000Z",
                  "text": "And it does sound like, oh, man.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:02:03.633Z"
                },
                {
                  "id": 913578716,
                  "realtime": true,
                  "start": 0.48,
                  "end": 1.9399999,
                  "spoken_at": "2025-07-04T00:02:37.000Z",
                  "text": "Do for yourself. Yeah.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:03:27.286Z"
                },
                {
                  "id": 913578717,
                  "realtime": true,
                  "start": 2.56,
                  "end": 12.015,
                  "spoken_at": "2025-07-04T00:02:39.000Z",
                  "text": "I'm diverting from the point. The point is I did analyze everything back when I went back home. I did I put myself in your situation. I like to do that way too much.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:03:27.286Z"
                },
                {
                  "id": 913578718,
                  "realtime": true,
                  "start": 14.975,
                  "end": 24.115,
                  "spoken_at": "2025-07-04T00:02:51.000Z",
                  "text": "You meaning not you. I would like, any In general. Yeah. Like, interesting situation that I feel like and then I basically just do a three sixty degree",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:03:27.287Z"
                },
                {
                  "id": 913578719,
                  "realtime": true,
                  "start": 25.535,
                  "end": 26.994999,
                  "spoken_at": "2025-07-04T00:03:02.000Z",
                  "text": "projection after the future.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:03:27.287Z"
                },
                {
                  "id": 913578720,
                  "realtime": true,
                  "start": 29.550001,
                  "end": 33.55,
                  "spoken_at": "2025-07-04T00:03:06.000Z",
                  "text": "That that that is why I can pinpoint exactly what would have happened and",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:03:27.287Z"
                },
                {
                  "id": 913578721,
                  "realtime": true,
                  "start": 34.91,
                  "end": 37.89,
                  "spoken_at": "2025-07-04T00:03:11.000Z",
                  "text": "Yes. We would have done. That's why Tell me the scenarios.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:03:27.287Z"
                },
                {
                  "id": 913578722,
                  "realtime": true,
                  "start": 40.12294,
                  "end": 43.78294,
                  "spoken_at": "2025-07-04T00:03:16.000Z",
                  "text": "What did you think about? It is a thing. Do",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:03:27.288Z"
                },
                {
                  "id": 913582283,
                  "realtime": true,
                  "start": 44.7696041,
                  "end": 53.162937500000005,
                  "spoken_at": "2025-07-04T00:03:21.000Z",
                  "text": "Do you remember what is how you think about stuff? It is always a mush unless you talk about it. So this is part of the process?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.537Z"
                },
                {
                  "id": 913582285,
                  "realtime": true,
                  "start": 55.462936500000005,
                  "end": 60.0579395,
                  "spoken_at": "2025-07-04T00:03:32.000Z",
                  "text": "Sometimes sometimes, yes. Sometimes so there are two types of things that interrupt.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.538Z"
                },
                {
                  "id": 913582286,
                  "realtime": true,
                  "start": 60.997937500000006,
                  "end": 62.27793750000001,
                  "spoken_at": "2025-07-04T00:03:37.000Z",
                  "text": "One is me analyzing",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.538Z"
                },
                {
                  "id": 913582287,
                  "realtime": true,
                  "start": 63.2379395,
                  "end": 66.6979375,
                  "spoken_at": "2025-07-04T00:03:39.000Z",
                  "text": "so me just sitting and just thinking about stuff",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.538Z"
                },
                {
                  "id": 913582288,
                  "realtime": true,
                  "start": 67.7979375,
                  "end": 71.3229375,
                  "spoken_at": "2025-07-04T00:03:44.000Z",
                  "text": "and then actualizing or verbalizing my thoughts",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.538Z"
                },
                {
                  "id": 913582289,
                  "realtime": true,
                  "start": 72.2829375,
                  "end": 74.7029375,
                  "spoken_at": "2025-07-04T00:03:49.000Z",
                  "text": "depending on which person I'm talking to.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.540Z"
                },
                {
                  "id": 913582291,
                  "realtime": true,
                  "start": 75.4829375,
                  "end": 79.9829375,
                  "spoken_at": "2025-07-04T00:03:52.000Z",
                  "text": "So if I'm talking to my mom, it's going to be a different way of visual",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.540Z"
                },
                {
                  "id": 913582290,
                  "realtime": true,
                  "start": 80.6029375,
                  "end": 81.5029375,
                  "spoken_at": "2025-07-04T00:03:57.000Z",
                  "text": "different way of",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.540Z"
                },
                {
                  "id": 913582292,
                  "realtime": true,
                  "start": 82.1229375,
                  "end": 83.5029375,
                  "spoken_at": "2025-07-04T00:03:58.000Z",
                  "text": "verbalizing those things.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.540Z"
                },
                {
                  "id": 913582293,
                  "realtime": true,
                  "start": 85.01899750000001,
                  "end": 90.7189975,
                  "spoken_at": "2025-07-04T00:04:01.000Z",
                  "text": "Because the situation that me and my mom are talking about are completely different, but I learned it from another experience.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:04:10.540Z"
                },
                {
                  "id": 913592874,
                  "realtime": true,
                  "start": 137.896,
                  "end": 142.87599999999998,
                  "spoken_at": "2025-07-04T00:04:54.000Z",
                  "text": "Like, not to die not not to not to linger in that thought in that specific thought. Oh, okay.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:05:44.720Z"
                },
                {
                  "id": 913592875,
                  "realtime": true,
                  "start": 143.57599969999998,
                  "end": 148.236,
                  "spoken_at": "2025-07-04T00:05:00.000Z",
                  "text": "That is this is also the reason why I tell people that AI can never",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.721Z"
                },
                {
                  "id": 913592876,
                  "realtime": true,
                  "start": 148.93599999999998,
                  "end": 150.44099999999997,
                  "spoken_at": "2025-07-04T00:05:05.000Z",
                  "text": "AI can never replace me",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.721Z"
                },
                {
                  "id": 913592877,
                  "realtime": true,
                  "start": 151.321,
                  "end": 152.46099999999998,
                  "spoken_at": "2025-07-04T00:05:08.000Z",
                  "text": "or humans is because",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.721Z"
                },
                {
                  "id": 913592878,
                  "realtime": true,
                  "start": 153.080999,
                  "end": 162.300999,
                  "spoken_at": "2025-07-04T00:05:09.000Z",
                  "text": "every single human being has this power of doing all of this computation, which is just events and that they can essentially collapse the part into a single linearized",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.721Z"
                },
                {
                  "id": 913592879,
                  "realtime": true,
                  "start": 162.921,
                  "end": 163.90099999999998,
                  "spoken_at": "2025-07-04T00:05:19.000Z",
                  "text": "format based on the",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.723Z"
                },
                {
                  "id": 913592880,
                  "realtime": true,
                  "start": 164.646,
                  "end": 168.826,
                  "spoken_at": "2025-07-04T00:05:21.000Z",
                  "text": "context that they are in. And each each of that thing is going to be completely",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.723Z"
                },
                {
                  "id": 913592881,
                  "realtime": true,
                  "start": 170.326,
                  "end": 172.74600199999998,
                  "spoken_at": "2025-07-04T00:05:27.000Z",
                  "text": "relatable to the other person despite",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.723Z"
                },
                {
                  "id": 913592885,
                  "realtime": true,
                  "start": 173.92600199999998,
                  "end": 177.30599999999998,
                  "spoken_at": "2025-07-04T00:05:30.000Z",
                  "text": "the story is not constructed from the exact same",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.723Z"
                },
                {
                  "id": 913592882,
                  "realtime": true,
                  "start": 179.101,
                  "end": 181.12100199999998,
                  "spoken_at": "2025-07-04T00:05:35.000Z",
                  "text": "single singular thought or singular prompt.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.723Z"
                },
                {
                  "id": 913592883,
                  "realtime": true,
                  "start": 181.74099999999999,
                  "end": 182.881,
                  "spoken_at": "2025-07-04T00:05:38.000Z",
                  "text": "So, anyways, another",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.723Z"
                },
                {
                  "id": 913592884,
                  "realtime": true,
                  "start": 183.821,
                  "end": 184.321,
                  "spoken_at": "2025-07-04T00:05:40.000Z",
                  "text": "another",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:05:44.723Z"
                },
                {
                  "id": 913597575,
                  "realtime": true,
                  "start": 184.641,
                  "end": 186.341,
                  "spoken_at": "2025-07-04T00:05:41.000Z",
                  "text": "One thing that I think about.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.068Z"
                },
                {
                  "id": 913597576,
                  "realtime": true,
                  "start": 189.361,
                  "end": 192.341,
                  "spoken_at": "2025-07-04T00:05:46.000Z",
                  "text": "When I say I don't have a social life, this is what I do.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.068Z"
                },
                {
                  "id": 913597577,
                  "realtime": true,
                  "start": 194.161,
                  "end": 200.05599999999998,
                  "spoken_at": "2025-07-04T00:05:50.000Z",
                  "text": "I'm like, I I How do you know? I gotta tell you something hilarious about streams of consciousness, but I can't",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913597578,
                  "realtime": true,
                  "start": 201.396,
                  "end": 207.736,
                  "spoken_at": "2025-07-04T00:05:58.000Z",
                  "text": "say it in here in my home. It's it's it's gotta be in person later, but it's it's it's Fair enough.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913597579,
                  "realtime": true,
                  "start": 208.836,
                  "end": 209.336,
                  "spoken_at": "2025-07-04T00:06:05.000Z",
                  "text": "Yes.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913597580,
                  "realtime": true,
                  "start": 210.916,
                  "end": 212.231,
                  "spoken_at": "2025-07-04T00:06:07.000Z",
                  "text": "And Okay.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913597581,
                  "realtime": true,
                  "start": 213.331,
                  "end": 214.711,
                  "spoken_at": "2025-07-04T00:06:10.000Z",
                  "text": "So Mike's thing is",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913597582,
                  "realtime": true,
                  "start": 216.531,
                  "end": 222.711,
                  "spoken_at": "2025-07-04T00:06:13.000Z",
                  "text": "yeah. The reason why it's I'll just type it to you. Whatever is comfortable,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913597583,
                  "realtime": true,
                  "start": 224.947,
                  "end": 225.447,
                  "spoken_at": "2025-07-04T00:06:21.000Z",
                  "text": "man.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913597584,
                  "realtime": true,
                  "start": 227.027,
                  "end": 227.847,
                  "spoken_at": "2025-07-04T00:06:23.000Z",
                  "text": "So the thing",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:06:31.070Z"
                },
                {
                  "id": 913601538,
                  "realtime": true,
                  "start": 228.80700000000002,
                  "end": 232.907,
                  "spoken_at": "2025-07-04T00:06:25.000Z",
                  "text": "What I'm trying to tell you the the entire story behind all of this",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:15.028Z"
                },
                {
                  "id": 913601540,
                  "realtime": true,
                  "start": 234.007,
                  "end": 234.507,
                  "spoken_at": "2025-07-04T00:06:30.000Z",
                  "text": "significant",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:15.028Z"
                },
                {
                  "id": 913601541,
                  "realtime": true,
                  "start": 235.1269997,
                  "end": 237.547,
                  "spoken_at": "2025-07-04T00:06:31.000Z",
                  "text": "tangent that we went into was",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:15.028Z"
                },
                {
                  "id": 913601542,
                  "realtime": true,
                  "start": 239.127,
                  "end": 240.827,
                  "spoken_at": "2025-07-04T00:06:35.000Z",
                  "text": "because of the fact that you did not",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:15.028Z"
                },
                {
                  "id": 913601543,
                  "realtime": true,
                  "start": 242.942,
                  "end": 255.122,
                  "spoken_at": "2025-07-04T00:06:39.000Z",
                  "text": "you did not fire Belinda when you were sick you were comfortable, consent with doing bad is the whole reason why she's still in the company. So you",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:15.028Z"
                },
                {
                  "id": 913601544,
                  "realtime": true,
                  "start": 256.457,
                  "end": 259.03699900000004,
                  "spoken_at": "2025-07-04T00:06:53.000Z",
                  "text": "you essentially Do you want to know why? Did not",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:15.029Z"
                },
                {
                  "id": 913601545,
                  "realtime": true,
                  "start": 260.217,
                  "end": 272.423,
                  "spoken_at": "2025-07-04T00:06:56.000Z",
                  "text": "act. I didn't. But you know what? Want to know why? Like, ultimately, what was the No. No. No. Okay. I don't want to know that. I right now. But the point is because you did not act, you",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:15.029Z"
                },
                {
                  "id": 913606477,
                  "realtime": true,
                  "start": 273.703,
                  "end": 275.5629999,
                  "spoken_at": "2025-07-04T00:07:10.000Z",
                  "text": "You were, like, relatively more",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:58.903Z"
                },
                {
                  "id": 913606478,
                  "realtime": true,
                  "start": 276.823,
                  "end": 277.323,
                  "spoken_at": "2025-07-04T00:07:13.000Z",
                  "text": "emotionally",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:58.903Z"
                },
                {
                  "id": 913606479,
                  "realtime": true,
                  "start": 277.943,
                  "end": 282.602999,
                  "spoken_at": "2025-07-04T00:07:14.000Z",
                  "text": "happy than if you would have done that, if you would have acted. Yes. This is what I mean.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:58.903Z"
                },
                {
                  "id": 913606480,
                  "realtime": true,
                  "start": 283.543,
                  "end": 286.388,
                  "spoken_at": "2025-07-04T00:07:20.000Z",
                  "text": "Majority of the time, it are the things that you don't do",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:58.904Z"
                },
                {
                  "id": 913606481,
                  "realtime": true,
                  "start": 287.348,
                  "end": 297.048,
                  "spoken_at": "2025-07-04T00:07:24.000Z",
                  "text": "results in a better emotional state than you than you Than doing that. Yeah. And that was the reason, like, I asked myself, would this make me happy? And the answer was no. Yeah.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:07:58.904Z"
                },
                {
                  "id": 913606482,
                  "realtime": true,
                  "start": 298.14799800000003,
                  "end": 301.368,
                  "spoken_at": "2025-07-04T00:07:34.000Z",
                  "text": "Exactly. That's it. End of the the thinking in my head.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:07:58.905Z"
                },
                {
                  "id": 913606483,
                  "realtime": true,
                  "start": 304.662998,
                  "end": 309.603,
                  "spoken_at": "2025-07-04T00:07:41.000Z",
                  "text": "Exactly. But but, yes, that is true. But the re and I I literally",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:58.905Z"
                },
                {
                  "id": 913606485,
                  "realtime": true,
                  "start": 310.703,
                  "end": 315.283,
                  "spoken_at": "2025-07-04T00:07:47.000Z",
                  "text": "remember, I the first thing that I asked you is, will you be comfortable",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:58.905Z"
                },
                {
                  "id": 913606484,
                  "realtime": true,
                  "start": 316.063,
                  "end": 317.683,
                  "spoken_at": "2025-07-04T00:07:52.000Z",
                  "text": "emotionally firing this person?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:07:58.905Z"
                },
                {
                  "id": 913610501,
                  "realtime": true,
                  "start": 318.8829999,
                  "end": 326.742999,
                  "spoken_at": "2025-07-04T00:07:55.000Z",
                  "text": "That was literally the the basically But that's a different that's a different question, though. Being comfortable and being happy are very different things.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:08:44.933Z"
                },
                {
                  "id": 913610502,
                  "realtime": true,
                  "start": 327.362999,
                  "end": 327.862999,
                  "spoken_at": "2025-07-04T00:08:04.000Z",
                  "text": "I",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:08:44.934Z"
                },
                {
                  "id": 913610503,
                  "realtime": true,
                  "start": 328.483,
                  "end": 341.58799899999997,
                  "spoken_at": "2025-07-04T00:08:05.000Z",
                  "text": "know. But I just clarified because you said, yeah. Yeah. I'm very comfortable doing that. I I I want to choose Or maybe honestly, or maybe at the time, I thought that. But when I was, like, alone after the call, maybe I changed my",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:08:44.934Z"
                },
                {
                  "id": 913610504,
                  "realtime": true,
                  "start": 342.448,
                  "end": 344.868,
                  "spoken_at": "2025-07-04T00:08:19.000Z",
                  "text": "my mind. And, like, that's why I called you",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:08:44.934Z"
                },
                {
                  "id": 913610505,
                  "realtime": true,
                  "start": 345.567998,
                  "end": 353.413,
                  "spoken_at": "2025-07-04T00:08:22.000Z",
                  "text": "too to not just hear you, but listen to what you said, then think combine that with what I had thought, and then spend the day thinking before I even K.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:08:44.936Z"
                },
                {
                  "id": 913610506,
                  "realtime": true,
                  "start": 354.113,
                  "end": 359.653,
                  "spoken_at": "2025-07-04T00:08:30.000Z",
                  "text": "You know? Yeah. The thing is the reason why also, one thing that you need to do,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:08:44.936Z"
                },
                {
                  "id": 913614169,
                  "realtime": true,
                  "start": 360.05299998000004,
                  "end": 364.9529997,
                  "spoken_at": "2025-07-04T00:08:36.000Z",
                  "text": "And this is not something that you need to do it today, tomorrow, but sometime in the future,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:09:27.365Z"
                },
                {
                  "id": 913614170,
                  "realtime": true,
                  "start": 365.9729997,
                  "end": 366.4729997,
                  "spoken_at": "2025-07-04T00:08:42.000Z",
                  "text": "you",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:09:27.365Z"
                },
                {
                  "id": 913614171,
                  "realtime": true,
                  "start": 367.49299970000004,
                  "end": 370.233,
                  "spoken_at": "2025-07-04T00:08:44.000Z",
                  "text": "you would want to process things faster",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:09:27.365Z"
                },
                {
                  "id": 913614172,
                  "realtime": true,
                  "start": 370.853,
                  "end": 375.148001,
                  "spoken_at": "2025-07-04T00:08:47.000Z",
                  "text": "a bit faster than your current base for two reasons. One,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:09:27.365Z"
                },
                {
                  "id": 913614173,
                  "realtime": true,
                  "start": 376.24800100000004,
                  "end": 377.788,
                  "spoken_at": "2025-07-04T00:08:52.000Z",
                  "text": "you're in a start of condo now.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:09:27.365Z"
                },
                {
                  "id": 913614174,
                  "realtime": true,
                  "start": 378.56800000000004,
                  "end": 388.243,
                  "spoken_at": "2025-07-04T00:08:55.000Z",
                  "text": "These kind of shit has these kind of shifts are going to happen every single day. You cannot take a day to make a decision. A decision that's this",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:09:27.365Z"
                },
                {
                  "id": 913614175,
                  "realtime": true,
                  "start": 389.903,
                  "end": 399.837998,
                  "spoken_at": "2025-07-04T00:09:06.000Z",
                  "text": "big? Not this big. Like, this big, yes. You should take at least a few few days, couple of days. I'm talking about in general. You your decision",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:09:27.365Z"
                },
                {
                  "id": 913620615,
                  "realtime": true,
                  "start": 447.10609089999997,
                  "end": 468.711,
                  "spoken_at": "2025-07-04T00:10:03.000Z",
                  "text": "Of, like, in your mind, you have a specific miles per hour, but you it's a number that is impossible to convey given the nature of what we're discussing. So and in my head is, okay. So Rob thinks that I'm going at 10, but maybe you think I'm going at 15. And and what I'm saying is, like, what speed does Surab say that is the optimal speed of because if you go too fast, you make decisions to",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:10:54.094Z"
                },
                {
                  "id": 913620616,
                  "realtime": true,
                  "start": 469.57099999999997,
                  "end": 472.371,
                  "spoken_at": "2025-07-04T00:10:26.000Z",
                  "text": "you know, in an impulse. So what's the",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:10:54.094Z"
                },
                {
                  "id": 913620617,
                  "realtime": true,
                  "start": 473.63599999999997,
                  "end": 484.13599999999997,
                  "spoken_at": "2025-07-04T00:10:30.000Z",
                  "text": "like, I get what you mean. And and the and I I agree in that the experience is kind of like, okay. Maybe turn up the speed a little bit. A little more. A little a little bit less. Are we for this? The same thing? Take a different route.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:10:54.094Z"
                },
                {
                  "id": 913620618,
                  "realtime": true,
                  "start": 484.916,
                  "end": 485.816,
                  "spoken_at": "2025-07-04T00:10:41.000Z",
                  "text": "Or that too.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:10:54.096Z"
                },
                {
                  "id": 913620619,
                  "realtime": true,
                  "start": 487.441,
                  "end": 493.540998,
                  "spoken_at": "2025-07-04T00:10:44.000Z",
                  "text": "Take take take the inner road sometimes because, Sean, there are there are traffic lights,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:10:54.096Z"
                },
                {
                  "id": 913637472,
                  "realtime": true,
                  "start": 540.712,
                  "end": 543.6919999,
                  "spoken_at": "2025-07-04T00:11:37.000Z",
                  "text": "Happy. If you're not having fun, what's the fucking use of doing things?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.403Z"
                },
                {
                  "id": 913637473,
                  "realtime": true,
                  "start": 544.792,
                  "end": 545.692,
                  "spoken_at": "2025-07-04T00:11:41.000Z",
                  "text": "Yeah. So choose",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.403Z"
                },
                {
                  "id": 913637474,
                  "realtime": true,
                  "start": 546.392,
                  "end": 546.892,
                  "spoken_at": "2025-07-04T00:11:43.000Z",
                  "text": "a",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.403Z"
                },
                {
                  "id": 913637475,
                  "realtime": true,
                  "start": 547.592,
                  "end": 552.172,
                  "spoken_at": "2025-07-04T00:11:44.000Z",
                  "text": "different route, if possible. No. And and, honestly, I I I feel like",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.403Z"
                },
                {
                  "id": 913637476,
                  "realtime": true,
                  "start": 553.0070000000001,
                  "end": 555.027,
                  "spoken_at": "2025-07-04T00:11:49.000Z",
                  "text": "for, like, my whole life, I've been,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.403Z"
                },
                {
                  "id": 913637477,
                  "realtime": true,
                  "start": 555.647,
                  "end": 559.187,
                  "spoken_at": "2025-07-04T00:11:52.000Z",
                  "text": "like, going from one degree to another to one you know? And",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.403Z"
                },
                {
                  "id": 913637478,
                  "realtime": true,
                  "start": 561.727,
                  "end": 569.322,
                  "spoken_at": "2025-07-04T00:11:58.000Z",
                  "text": "and, like, this is, like I see this company as, like, or start ups, like, as my way of, like, truly finding happiness in,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.404Z"
                },
                {
                  "id": 913637479,
                  "realtime": true,
                  "start": 571.142,
                  "end": 576.682,
                  "spoken_at": "2025-07-04T00:12:07.000Z",
                  "text": "like not just, like, at work, but, like, being able to set your schedule is, like like, I'm willing to sacrifice a lot for",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.404Z"
                },
                {
                  "id": 913637480,
                  "realtime": true,
                  "start": 577.542,
                  "end": 578.602,
                  "spoken_at": "2025-07-04T00:12:14.000Z",
                  "text": "for that.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.404Z"
                },
                {
                  "id": 913637481,
                  "realtime": true,
                  "start": 579.457,
                  "end": 582.817,
                  "spoken_at": "2025-07-04T00:12:16.000Z",
                  "text": "That's why I'm treating the I mean, this is my baby. Like, I",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.404Z"
                },
                {
                  "id": 913637482,
                  "realtime": true,
                  "start": 583.617,
                  "end": 584.117,
                  "spoken_at": "2025-07-04T00:12:20.000Z",
                  "text": "Yeah.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:12:27.404Z"
                },
                {
                  "id": 913646296,
                  "realtime": true,
                  "start": 0.76,
                  "end": 6.5,
                  "spoken_at": "2025-07-04T00:13:13.000Z",
                  "text": "Your company evolves, and you you learn from these experiences, and then you will have that. Okay. Anyway,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:02.974Z"
                },
                {
                  "id": 913646297,
                  "realtime": true,
                  "start": 8.08,
                  "end": 10.9,
                  "spoken_at": "2025-07-04T00:13:21.000Z",
                  "text": "you will care more about this surviving",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:02.975Z"
                },
                {
                  "id": 913646298,
                  "realtime": true,
                  "start": 11.759999,
                  "end": 14.66,
                  "spoken_at": "2025-07-04T00:13:24.000Z",
                  "text": "than you enjoying the process of building this.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:02.975Z"
                },
                {
                  "id": 913646299,
                  "realtime": true,
                  "start": 16.33077,
                  "end": 29.85,
                  "spoken_at": "2025-07-04T00:13:29.000Z",
                  "text": "I can I can safely say that you are not enjoying the process of this? There are too many things that are that you've you thought this is the world view when you started this company.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:02.975Z"
                },
                {
                  "id": 913646300,
                  "realtime": true,
                  "start": 30.51,
                  "end": 38.19,
                  "spoken_at": "2025-07-04T00:13:43.000Z",
                  "text": "And now that you are living through it, it is significantly different than what you initially thought. Yes.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:02.975Z"
                },
                {
                  "id": 913646301,
                  "realtime": true,
                  "start": 39.13,
                  "end": 43.07,
                  "spoken_at": "2025-07-04T00:13:52.000Z",
                  "text": "It's significantly it's significantly more more horrible than I thought.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:02.975Z"
                },
                {
                  "id": 913646302,
                  "realtime": true,
                  "start": 44.73694,
                  "end": 45.95694,
                  "spoken_at": "2025-07-04T00:13:57.000Z",
                  "text": "That's really what it is.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:02.975Z"
                },
                {
                  "id": 913651685,
                  "realtime": true,
                  "start": 48.516937500000004,
                  "end": 52.2969372,
                  "spoken_at": "2025-07-04T00:14:01.000Z",
                  "text": "You are the judge of how horrible it is. I'm I'm That's pretty horrible.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:49.592Z"
                },
                {
                  "id": 913651686,
                  "realtime": true,
                  "start": 53.9569375,
                  "end": 57.5769375,
                  "spoken_at": "2025-07-04T00:14:06.000Z",
                  "text": "I know it. I know I'm in no position to,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:49.593Z"
                },
                {
                  "id": 913651688,
                  "realtime": true,
                  "start": 58.3619375,
                  "end": 60.38193750000001,
                  "spoken_at": "2025-07-04T00:14:11.000Z",
                  "text": "basically comment on that. Anyways",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:49.593Z"
                },
                {
                  "id": 913651687,
                  "realtime": true,
                  "start": 61.001937500000004,
                  "end": 65.9819375,
                  "spoken_at": "2025-07-04T00:14:13.000Z",
                  "text": "I mean, there are moments of happiness in it. Yeah. That's a different thing.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:49.593Z"
                },
                {
                  "id": 913651689,
                  "realtime": true,
                  "start": 67.0019375,
                  "end": 71.4219375,
                  "spoken_at": "2025-07-04T00:14:19.000Z",
                  "text": "It it okay. This is a very weird example. But even in the pain of",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:14:49.593Z"
                },
                {
                  "id": 913653311,
                  "realtime": true,
                  "start": 84.6169375,
                  "end": 96.0769365,
                  "spoken_at": "2025-07-04T00:14:37.000Z",
                  "text": "Even if you have cancer, you're on chemotherapy, then that oh my god. My brain is suffering. Yeah. I was like, Jesus fucking Christ. That's a horrible anyway. My brain is so fucking bad.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:14.300Z"
                },
                {
                  "id": 913653312,
                  "realtime": true,
                  "start": 97.1619375,
                  "end": 102.7819375,
                  "spoken_at": "2025-07-04T00:14:50.000Z",
                  "text": "Yeah. Wait. I it's funny that that was, like, my thought when you I was like, okay. Well, I guess we're going there.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:14.300Z"
                },
                {
                  "id": 913653313,
                  "realtime": true,
                  "start": 103.7219375,
                  "end": 108.6219375,
                  "spoken_at": "2025-07-04T00:14:56.000Z",
                  "text": "Okay. Yeah. But I have cancer. If you have even if you are on chemotherapy,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:14.300Z"
                },
                {
                  "id": 913655980,
                  "realtime": true,
                  "start": 109.1819375,
                  "end": 112.8819375,
                  "spoken_at": "2025-07-04T00:15:02.000Z",
                  "text": "You still have bit of fun even though it's killing you.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:51.389Z"
                },
                {
                  "id": 913655981,
                  "realtime": true,
                  "start": 114.5419375,
                  "end": 128.57693749999999,
                  "spoken_at": "2025-07-04T00:15:07.000Z",
                  "text": "You're you're still happy, but that doesn't mean that you're old or happy. So that's not that that is what I was trying to find. But and and and you That'll suggest dark example. No. But, you you know, like, those moments of happiness are usually when I'm, like,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:51.389Z"
                },
                {
                  "id": 913655982,
                  "realtime": true,
                  "start": 129.8369375,
                  "end": 135.2969375,
                  "spoken_at": "2025-07-04T00:15:22.000Z",
                  "text": "coding on something that didn't work and not worked, and I try and say, great. Or I'm in the meeting",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:51.390Z"
                },
                {
                  "id": 913655983,
                  "realtime": true,
                  "start": 135.8419375,
                  "end": 139.5219375,
                  "spoken_at": "2025-07-04T00:15:28.000Z",
                  "text": "with Belinda and Michelle. They're great meetings. Like",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:51.390Z"
                },
                {
                  "id": 913655984,
                  "realtime": true,
                  "start": 140.5219395,
                  "end": 153.10500050000002,
                  "spoken_at": "2025-07-04T00:15:33.000Z",
                  "text": "Yeah. Like, we have we have, like, we we all have a great time. Yeah. And and, like, if I and, honestly, I feel like your words. Honestly, that's what is kind of is, like, the glimmer of hope that I have is that",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:15:51.390Z"
                },
                {
                  "id": 913658902,
                  "realtime": true,
                  "start": 153.985,
                  "end": 159.12500000000003,
                  "spoken_at": "2025-07-04T00:15:46.000Z",
                  "text": "And, like, it's not just, like, that we're, like, cracking jokes and stuff. No. Like, we make decisions. We we're gonna",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:16:36.338Z"
                },
                {
                  "id": 913658903,
                  "realtime": true,
                  "start": 160.305,
                  "end": 165.76500000000001,
                  "spoken_at": "2025-07-04T00:15:53.000Z",
                  "text": "But Yeah. We're getting things done. But in those moments, I am happy.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:16:36.338Z"
                },
                {
                  "id": 913658904,
                  "realtime": true,
                  "start": 166.869999,
                  "end": 176.71,
                  "spoken_at": "2025-07-04T00:15:59.000Z",
                  "text": "It's just the other 90% of the time So where where I feel only things that I told you. This is what I'm trying to get at. Right? Right now, you want to your",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:16:36.338Z"
                },
                {
                  "id": 913658905,
                  "realtime": true,
                  "start": 177.75000000000003,
                  "end": 179.61,
                  "spoken_at": "2025-07-04T00:16:10.000Z",
                  "text": "you move you shifted from",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:16:36.338Z"
                },
                {
                  "id": 913658906,
                  "realtime": true,
                  "start": 180.39000000000001,
                  "end": 182.09999900000003,
                  "spoken_at": "2025-07-04T00:16:13.000Z",
                  "text": "winning to surviving.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:16:36.338Z"
                },
                {
                  "id": 913658907,
                  "realtime": true,
                  "start": 183.985001,
                  "end": 187.185,
                  "spoken_at": "2025-07-04T00:16:16.000Z",
                  "text": "And sometime in the future, and I'm 100%",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:16:36.338Z"
                },
                {
                  "id": 913658908,
                  "realtime": true,
                  "start": 187.185,
                  "end": 188.88500000000002,
                  "spoken_at": "2025-07-04T00:16:20.000Z",
                  "text": "sure, you will move on from",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:16:36.340Z"
                },
                {
                  "id": 913658909,
                  "realtime": true,
                  "start": 189.585,
                  "end": 193.60500000000002,
                  "spoken_at": "2025-07-04T00:16:22.000Z",
                  "text": "surviving to enjoying the process. So what you're saying is that this is normal?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:16:36.340Z"
                },
                {
                  "id": 913661509,
                  "realtime": true,
                  "start": 195.12500000000003,
                  "end": 195.94500000000002,
                  "spoken_at": "2025-07-04T00:16:28.000Z",
                  "text": "So the thing",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.032Z"
                },
                {
                  "id": 913661512,
                  "realtime": true,
                  "start": 196.56500000000003,
                  "end": 200.025,
                  "spoken_at": "2025-07-04T00:16:29.000Z",
                  "text": "is when you were when your mindset was about winning,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.033Z"
                },
                {
                  "id": 913661511,
                  "realtime": true,
                  "start": 201.12500000000003,
                  "end": 207.145,
                  "spoken_at": "2025-07-04T00:16:34.000Z",
                  "text": "you were you wanted to achieve the goal. Yes. You always cared about achieving the achieving the goal.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.033Z"
                },
                {
                  "id": 913661514,
                  "realtime": true,
                  "start": 208.53000000000003,
                  "end": 214.31,
                  "spoken_at": "2025-07-04T00:16:41.000Z",
                  "text": "Right? Yeah. And goal always moved. Yeah. Once you achieve that goal, it always moved.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.034Z"
                },
                {
                  "id": 913661510,
                  "realtime": true,
                  "start": 215.01000000000002,
                  "end": 217.91000000000003,
                  "spoken_at": "2025-07-04T00:16:47.000Z",
                  "text": "Right? That gave you happiness. Yes.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.034Z"
                },
                {
                  "id": 913661515,
                  "realtime": true,
                  "start": 218.610001,
                  "end": 220.07000000000002,
                  "spoken_at": "2025-07-04T00:16:51.000Z",
                  "text": "Right now, in this mindset,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.034Z"
                },
                {
                  "id": 913661516,
                  "realtime": true,
                  "start": 221.33,
                  "end": 222.46500000000003,
                  "spoken_at": "2025-07-04T00:16:54.000Z",
                  "text": "all you want to do",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.034Z"
                },
                {
                  "id": 913661518,
                  "realtime": true,
                  "start": 226.06500000000003,
                  "end": 229.205,
                  "spoken_at": "2025-07-04T00:16:59.000Z",
                  "text": "is make Cogno survive. Make this thing survive.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.034Z"
                },
                {
                  "id": 913661513,
                  "realtime": true,
                  "start": 229.90500000000003,
                  "end": 237.967,
                  "spoken_at": "2025-07-04T00:17:02.000Z",
                  "text": "Once you achieve that goal, some next crisis will come. You will start chasing that crisis, and you will start wanting to save that",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:17:17.034Z"
                },
                {
                  "id": 913668313,
                  "realtime": true,
                  "start": 286.59999990000006,
                  "end": 287.1000000000001,
                  "spoken_at": "2025-07-04T00:17:59.000Z",
                  "text": "So",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:18:48.310Z"
                },
                {
                  "id": 913668314,
                  "realtime": true,
                  "start": 289.7200000000001,
                  "end": 291.24000000000007,
                  "spoken_at": "2025-07-04T00:18:02.000Z",
                  "text": "it's essentially it doesn't matter if",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:18:48.310Z"
                },
                {
                  "id": 913668315,
                  "realtime": true,
                  "start": 292.52000000000004,
                  "end": 294.38000000000005,
                  "spoken_at": "2025-07-04T00:18:05.000Z",
                  "text": "in that state, in that mindset,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:18:48.310Z"
                },
                {
                  "id": 913668316,
                  "realtime": true,
                  "start": 295.63999900000005,
                  "end": 303.0450000000001,
                  "spoken_at": "2025-07-04T00:18:08.000Z",
                  "text": "the it's essentially about the fact that you would not care about, well, the company that you are starting a cognos,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:18:48.310Z"
                },
                {
                  "id": 913668317,
                  "realtime": true,
                  "start": 303.6650000000001,
                  "end": 315.44500000000005,
                  "spoken_at": "2025-07-04T00:18:16.000Z",
                  "text": "it survives. I don't give. I don't care. I don't mind if it doesn't serve. If it doesn't survive, it doesn't survive. If it survives, amazing for me. It's both cases are golden for me. And then",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:18:48.310Z"
                },
                {
                  "id": 913668318,
                  "realtime": true,
                  "start": 316.00999800000005,
                  "end": 324.2300000000001,
                  "spoken_at": "2025-07-04T00:18:28.000Z",
                  "text": "you will not think about, well, I want to be the first $10,000,000,000 company, blah blah blah blah. I don't I don't wanna chase the goal.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:18:48.310Z"
                },
                {
                  "id": 913668319,
                  "realtime": true,
                  "start": 325.61094,
                  "end": 331.57493600000004,
                  "spoken_at": "2025-07-04T00:18:38.000Z",
                  "text": "So you would not be chasing the goal during that in that mindset. Rather, you will be happy",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:18:48.310Z"
                },
                {
                  "id": 913674595,
                  "realtime": true,
                  "start": 379.45866665,
                  "end": 381.612,
                  "spoken_at": "2025-07-04T00:19:32.000Z",
                  "text": "That's why I told you. Either you will learn you will",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.932Z"
                },
                {
                  "id": 913674597,
                  "realtime": true,
                  "start": 382.3119998,
                  "end": 385.052,
                  "spoken_at": "2025-07-04T00:19:35.000Z",
                  "text": "because you are so you thought that",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.932Z"
                },
                {
                  "id": 913674598,
                  "realtime": true,
                  "start": 385.672,
                  "end": 388.412,
                  "spoken_at": "2025-07-04T00:19:38.000Z",
                  "text": "you care more about the output, the final product.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.932Z"
                },
                {
                  "id": 913674599,
                  "realtime": true,
                  "start": 389.032,
                  "end": 392.6519995,
                  "spoken_at": "2025-07-04T00:19:41.000Z",
                  "text": "I'm pretty sure you still think that you care more about the final product.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.932Z"
                },
                {
                  "id": 913674600,
                  "realtime": true,
                  "start": 394.933666,
                  "end": 398.16700000000003,
                  "spoken_at": "2025-07-04T00:19:47.000Z",
                  "text": "But in reality, you you enjoy",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.932Z"
                },
                {
                  "id": 913674601,
                  "realtime": true,
                  "start": 399.587,
                  "end": 400.087,
                  "spoken_at": "2025-07-04T00:19:52.000Z",
                  "text": "fine",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674602,
                  "realtime": true,
                  "start": 400.707,
                  "end": 402.807,
                  "spoken_at": "2025-07-04T00:19:53.000Z",
                  "text": "solving a problem rather than",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674603,
                  "realtime": true,
                  "start": 404.626999,
                  "end": 405.606998,
                  "spoken_at": "2025-07-04T00:19:57.000Z",
                  "text": "completing the task,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674604,
                  "realtime": true,
                  "start": 406.362,
                  "end": 407.502,
                  "spoken_at": "2025-07-04T00:19:59.000Z",
                  "text": "completing the problem.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674605,
                  "realtime": true,
                  "start": 411.722,
                  "end": 412.222,
                  "spoken_at": "2025-07-04T00:20:04.000Z",
                  "text": "Yes.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674606,
                  "realtime": true,
                  "start": 412.922,
                  "end": 413.422,
                  "spoken_at": "2025-07-04T00:20:05.000Z",
                  "text": "And",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674608,
                  "realtime": true,
                  "start": 414.121998,
                  "end": 415.502,
                  "spoken_at": "2025-07-04T00:20:07.000Z",
                  "text": "I know for a fact",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674609,
                  "realtime": true,
                  "start": 416.522,
                  "end": 417.822,
                  "spoken_at": "2025-07-04T00:20:09.000Z",
                  "text": "that you always thought",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913674607,
                  "realtime": true,
                  "start": 418.387,
                  "end": 424.727,
                  "spoken_at": "2025-07-04T00:20:11.000Z",
                  "text": "you still think you like you and you want to reach you like finishing the task of solving that problem.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:20:21.933Z"
                },
                {
                  "id": 913681681,
                  "realtime": true,
                  "start": 426.5669999,
                  "end": 427.06699999999995,
                  "spoken_at": "2025-07-04T00:20:19.000Z",
                  "text": "But",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:08.768Z"
                },
                {
                  "id": 913681684,
                  "realtime": true,
                  "start": 427.767,
                  "end": 451.541999,
                  "spoken_at": "2025-07-04T00:20:20.000Z",
                  "text": "in reality, based on the amount of information I know about the person that you are, that I know who what kind of person you are and the recent experiences, the things that you mentioned, like, 10% of your Joy comes from actually enjoying the process of building it, solving finding the bug, and solving the bug. And all of that all of that stuff that you mentioned,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:08.768Z"
                },
                {
                  "id": 913681712,
                  "realtime": true,
                  "start": 452.137,
                  "end": 457.917,
                  "spoken_at": "2025-07-04T00:20:45.000Z",
                  "text": "it showcases the fact that you enjoy the process, not the end of it. Not the end of it.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:08.768Z"
                },
                {
                  "id": 913681683,
                  "realtime": true,
                  "start": 458.536998,
                  "end": 459.036998,
                  "spoken_at": "2025-07-04T00:20:51.000Z",
                  "text": "And",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:08.768Z"
                },
                {
                  "id": 913681687,
                  "realtime": true,
                  "start": 459.657,
                  "end": 467.277,
                  "spoken_at": "2025-07-04T00:20:52.000Z",
                  "text": "I'm going to tell you this right now so that later on when you when you realize it, I can I can I can deal with it? I can laugh.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:08.768Z"
                },
                {
                  "id": 913681715,
                  "realtime": true,
                  "start": 469.02693999999997,
                  "end": 469.52693999999997,
                  "spoken_at": "2025-07-04T00:21:01.000Z",
                  "text": "So",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:08.768Z"
                },
                {
                  "id": 913707153,
                  "realtime": true,
                  "start": 470.16693749999996,
                  "end": 475.6269375,
                  "spoken_at": "2025-07-04T00:21:03.000Z",
                  "text": "So this is all about you and I think I just I just give a nice smile at myself. I'm like, yeah. Nice.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.708Z"
                },
                {
                  "id": 913707154,
                  "realtime": true,
                  "start": 477.60693749999996,
                  "end": 478.8269375,
                  "spoken_at": "2025-07-04T00:21:10.000Z",
                  "text": "I help that kid.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.709Z"
                },
                {
                  "id": 913707155,
                  "realtime": true,
                  "start": 479.6869375,
                  "end": 480.98693749999995,
                  "spoken_at": "2025-07-04T00:21:12.000Z",
                  "text": "Yeah. No. I mean",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.709Z"
                },
                {
                  "id": 913707156,
                  "realtime": true,
                  "start": 481.6219375,
                  "end": 485.5619375,
                  "spoken_at": "2025-07-04T00:21:14.000Z",
                  "text": "I'm doing good. I I I this is like",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.709Z"
                },
                {
                  "id": 913707157,
                  "realtime": true,
                  "start": 487.78193849999997,
                  "end": 492.36193749999995,
                  "spoken_at": "2025-07-04T00:21:20.000Z",
                  "text": "Better than therapy? This conversation is like drinking your medicine.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.709Z"
                },
                {
                  "id": 913707158,
                  "realtime": true,
                  "start": 494.0219365,
                  "end": 496.2019375,
                  "spoken_at": "2025-07-04T00:21:26.000Z",
                  "text": "It's like it doesn't bring me",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.709Z"
                },
                {
                  "id": 913707159,
                  "realtime": true,
                  "start": 497.69293749999997,
                  "end": 503.53693749999996,
                  "spoken_at": "2025-07-04T00:21:30.000Z",
                  "text": "pleasure to hear a lot of these things, but it gives me pleasure in thinking that it will avoid future pain.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.709Z"
                },
                {
                  "id": 913707160,
                  "realtime": true,
                  "start": 505.2769375,
                  "end": 505.7769375,
                  "spoken_at": "2025-07-04T00:21:38.000Z",
                  "text": "Yeah.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.711Z"
                },
                {
                  "id": 913707161,
                  "realtime": true,
                  "start": 506.47693749999996,
                  "end": 509.3769375,
                  "spoken_at": "2025-07-04T00:21:39.000Z",
                  "text": "Or at least I hope that I'll take some of these things and actually",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:21:52.711Z"
                },
                {
                  "id": 913720485,
                  "realtime": true,
                  "start": 509.8569375,
                  "end": 510.8369375,
                  "spoken_at": "2025-07-04T00:21:42.000Z",
                  "text": "Do what?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:22:33.362Z"
                },
                {
                  "id": 913720486,
                  "realtime": true,
                  "start": 515.2969375,
                  "end": 520.1169375,
                  "spoken_at": "2025-07-04T00:21:48.000Z",
                  "text": "The other thing is remember I told you, it is much easier to change",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:22:33.362Z"
                },
                {
                  "id": 913720487,
                  "realtime": true,
                  "start": 522.3019375,
                  "end": 527.4419375,
                  "spoken_at": "2025-07-04T00:21:55.000Z",
                  "text": "after getting after experiencing it yourself, then exactly what is going to happen to you.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:22:33.363Z"
                },
                {
                  "id": 913720488,
                  "realtime": true,
                  "start": 528.7819365,
                  "end": 535.1219365,
                  "spoken_at": "2025-07-04T00:22:01.000Z",
                  "text": "Yeah. I don't expect it. No offense, but I don't expect people to change just by listening to other people's experience.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:22:33.363Z"
                },
                {
                  "id": 913720490,
                  "realtime": true,
                  "start": 536.2469365,
                  "end": 549.5689995,
                  "spoken_at": "2025-07-04T00:22:09.000Z",
                  "text": "If if that was the case, then I would have listened to every single thing that my mom told me when I was young. Yeah. I ignored it happily during my day. And I'm and I'm well aware that I have a tendency to",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:22:33.363Z"
                },
                {
                  "id": 913720489,
                  "realtime": true,
                  "start": 550.1290015,
                  "end": 555.0289975,
                  "spoken_at": "2025-07-04T00:22:23.000Z",
                  "text": "to to not do a little talk. That is every human being's nature. That is every animal's",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:22:33.363Z"
                },
                {
                  "id": 913736979,
                  "realtime": true,
                  "start": 603.736,
                  "end": 605.596,
                  "spoken_at": "2025-07-04T00:23:16.000Z",
                  "text": "Well, you and I are the same age.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:24:05.385Z"
                },
                {
                  "id": 913736980,
                  "realtime": true,
                  "start": 606.296,
                  "end": 614.6410000000001,
                  "spoken_at": "2025-07-04T00:23:19.000Z",
                  "text": "Or you're one year younger than me. You're a year older than me. No. It's kind of odd. When I was",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:24:05.385Z"
                },
                {
                  "id": 913736981,
                  "realtime": true,
                  "start": 615.5210000000001,
                  "end": 622.981,
                  "spoken_at": "2025-07-04T00:23:28.000Z",
                  "text": "I I had this experience when I was 21. 20. Yeah. Yeah. I know that our life experiences are very different.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913736982,
                  "realtime": true,
                  "start": 623.921,
                  "end": 626.981,
                  "spoken_at": "2025-07-04T00:23:36.000Z",
                  "text": "Yeah. But it tends to be almost similar because",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913736983,
                  "realtime": true,
                  "start": 627.921,
                  "end": 629.940998,
                  "spoken_at": "2025-07-04T00:23:40.000Z",
                  "text": "We we land it. We're we're in a similar",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913736984,
                  "realtime": true,
                  "start": 631.189333,
                  "end": 634.836,
                  "spoken_at": "2025-07-04T00:23:44.000Z",
                  "text": "at least at the very high level, on a similar place now,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913736985,
                  "realtime": true,
                  "start": 636.096,
                  "end": 639.956,
                  "spoken_at": "2025-07-04T00:23:49.000Z",
                  "text": "like, starting companies in the stages. What if if you yeah. If you",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913736986,
                  "realtime": true,
                  "start": 640.556,
                  "end": 644.0110000000001,
                  "spoken_at": "2025-07-04T00:23:53.000Z",
                  "text": "in a word to act format, we are very close to each other in one of the.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913736987,
                  "realtime": true,
                  "start": 644.7710040000001,
                  "end": 647.311,
                  "spoken_at": "2025-07-04T00:23:57.000Z",
                  "text": "Exactly. Like, we we came to a similar spot",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913736988,
                  "realtime": true,
                  "start": 648.091004,
                  "end": 648.831,
                  "spoken_at": "2025-07-04T00:24:01.000Z",
                  "text": "from different",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:24:05.386Z"
                },
                {
                  "id": 913752498,
                  "realtime": true,
                  "start": 0.5333333,
                  "end": 2.6333332,
                  "spoken_at": "2025-07-04T00:25:51.000Z",
                  "text": "I'll say that. But",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752499,
                  "realtime": true,
                  "start": 3.1999998,
                  "end": 4.9,
                  "spoken_at": "2025-07-04T00:25:54.000Z",
                  "text": "See. I have failed quite",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752500,
                  "realtime": true,
                  "start": 5.6,
                  "end": 6.58,
                  "spoken_at": "2025-07-04T00:25:56.000Z",
                  "text": "spectacularly before.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752501,
                  "realtime": true,
                  "start": 9.84,
                  "end": 10.9,
                  "spoken_at": "2025-07-04T00:26:01.000Z",
                  "text": "And so I I think",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752502,
                  "realtime": true,
                  "start": 11.92,
                  "end": 13.059999,
                  "spoken_at": "2025-07-04T00:26:03.000Z",
                  "text": "that that experience",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752503,
                  "realtime": true,
                  "start": 14.245,
                  "end": 20.585,
                  "spoken_at": "2025-07-04T00:26:05.000Z",
                  "text": "instilled something in me. And it's the question that at every step, I do ask myself, what if I'm completely wrong?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752504,
                  "realtime": true,
                  "start": 21.605,
                  "end": 22.105,
                  "spoken_at": "2025-07-04T00:26:12.000Z",
                  "text": "You",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752508,
                  "realtime": true,
                  "start": 23.205,
                  "end": 28.345001,
                  "spoken_at": "2025-07-04T00:26:14.000Z",
                  "text": "we just haven't had the same character development because you haven't gone through it. Exactly.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752505,
                  "realtime": true,
                  "start": 29.48,
                  "end": 33.98,
                  "spoken_at": "2025-07-04T00:26:20.000Z",
                  "text": "Exactly. Like, just in the way they conduct themselves. You just know. Yes.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752509,
                  "realtime": true,
                  "start": 34.68,
                  "end": 35.260002,
                  "spoken_at": "2025-07-04T00:26:25.000Z",
                  "text": "Yes. And",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752507,
                  "realtime": true,
                  "start": 35.88,
                  "end": 37.02,
                  "spoken_at": "2025-07-04T00:26:27.000Z",
                  "text": "and when so",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752510,
                  "realtime": true,
                  "start": 41.8,
                  "end": 42.3,
                  "spoken_at": "2025-07-04T00:26:32.000Z",
                  "text": "Mhmm.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752506,
                  "realtime": true,
                  "start": 43,
                  "end": 43.9,
                  "spoken_at": "2025-07-04T00:26:34.000Z",
                  "text": "Okay. So",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913752511,
                  "realtime": true,
                  "start": 44.482998,
                  "end": 44.982998,
                  "spoken_at": "2025-07-04T00:26:35.000Z",
                  "text": "here's",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:26:20.798Z"
                },
                {
                  "id": 913829583,
                  "realtime": true,
                  "start": 92.984,
                  "end": 96.684,
                  "spoken_at": "2025-07-04T00:27:24.000Z",
                  "text": "About they are not that mature. It's just that the the the the",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.479Z"
                },
                {
                  "id": 913829584,
                  "realtime": true,
                  "start": 97.624,
                  "end": 101.644,
                  "spoken_at": "2025-07-04T00:27:28.000Z",
                  "text": "way they are they don't have I think my level of experience,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.479Z"
                },
                {
                  "id": 913829585,
                  "realtime": true,
                  "start": 102.184,
                  "end": 104.764,
                  "spoken_at": "2025-07-04T00:27:33.000Z",
                  "text": "my my life took me in a different direction,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.479Z"
                },
                {
                  "id": 913829586,
                  "realtime": true,
                  "start": 105.783999,
                  "end": 106.759,
                  "spoken_at": "2025-07-04T00:27:36.000Z",
                  "text": "and it taught me",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.479Z"
                },
                {
                  "id": 913829587,
                  "realtime": true,
                  "start": 107.879,
                  "end": 108.459,
                  "spoken_at": "2025-07-04T00:27:39.000Z",
                  "text": "things that",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.479Z"
                },
                {
                  "id": 913829588,
                  "realtime": true,
                  "start": 111.087,
                  "end": 115.258999,
                  "spoken_at": "2025-07-04T00:27:42.000Z",
                  "text": "well, I I observed those things in older people.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.479Z"
                },
                {
                  "id": 913829589,
                  "realtime": true,
                  "start": 116.359,
                  "end": 119.898998,
                  "spoken_at": "2025-07-04T00:27:47.000Z",
                  "text": "Okay. I can see that. Like, on the contrary,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.479Z"
                },
                {
                  "id": 913829590,
                  "realtime": true,
                  "start": 120.51899900000001,
                  "end": 121.578998,
                  "spoken_at": "2025-07-04T00:27:51.000Z",
                  "text": "I feel like",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.480Z"
                },
                {
                  "id": 913829591,
                  "realtime": true,
                  "start": 122.344,
                  "end": 124.28399999999999,
                  "spoken_at": "2025-07-04T00:27:53.000Z",
                  "text": "the younger generation is a bit differently",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.480Z"
                },
                {
                  "id": 913829592,
                  "realtime": true,
                  "start": 124.904,
                  "end": 127.72399999999999,
                  "spoken_at": "2025-07-04T00:27:56.000Z",
                  "text": "than the older generation or the millennial",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.480Z"
                },
                {
                  "id": 913829594,
                  "realtime": true,
                  "start": 128.504,
                  "end": 130.843998,
                  "spoken_at": "2025-07-04T00:27:59.000Z",
                  "text": "because they had they have access to it.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.480Z"
                },
                {
                  "id": 913829593,
                  "realtime": true,
                  "start": 131.864002,
                  "end": 132.364002,
                  "spoken_at": "2025-07-04T00:28:03.000Z",
                  "text": "But",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:27:52.480Z"
                },
                {
                  "id": 913836052,
                  "realtime": true,
                  "start": 132.924,
                  "end": 133.424,
                  "spoken_at": "2025-07-04T00:28:04.000Z",
                  "text": "But",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.151Z"
                },
                {
                  "id": 913836053,
                  "realtime": true,
                  "start": 134.5239998,
                  "end": 143.904,
                  "spoken_at": "2025-07-04T00:28:05.000Z",
                  "text": "majority of my like, even though they are mature Can can you can you hold that thought? So you're saying that the older the Gen Z are more mature than the the millennials. Is that what you're saying?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.151Z"
                },
                {
                  "id": 913836054,
                  "realtime": true,
                  "start": 144.684,
                  "end": 145.663999,
                  "spoken_at": "2025-07-04T00:28:15.000Z",
                  "text": "In terms of",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.151Z"
                },
                {
                  "id": 913836059,
                  "realtime": true,
                  "start": 147.00899950000002,
                  "end": 151.428999,
                  "spoken_at": "2025-07-04T00:28:18.000Z",
                  "text": "maturity, like, like you see you see 20 year old, 13 year old,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.151Z"
                },
                {
                  "id": 913836055,
                  "realtime": true,
                  "start": 152.12900000000002,
                  "end": 154.949,
                  "spoken_at": "2025-07-04T00:28:23.000Z",
                  "text": "18 year old being significantly mature,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.152Z"
                },
                {
                  "id": 913836056,
                  "realtime": true,
                  "start": 155.649,
                  "end": 166.274,
                  "spoken_at": "2025-07-04T00:28:26.000Z",
                  "text": "not not acting like a fucking childish person as compared to people our age. I fucking act like a childish person because I I was never I I did not have that much access to information",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.152Z"
                },
                {
                  "id": 913836060,
                  "realtime": true,
                  "start": 167.854,
                  "end": 171.794,
                  "spoken_at": "2025-07-04T00:28:39.000Z",
                  "text": "because they they don't because my information, my social circle",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.152Z"
                },
                {
                  "id": 913836057,
                  "realtime": true,
                  "start": 172.334,
                  "end": 177.805,
                  "spoken_at": "2025-07-04T00:28:43.000Z",
                  "text": "was used when I grew up was essentially just the people I interacted in person. Right?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.152Z"
                },
                {
                  "id": 913844657,
                  "realtime": true,
                  "start": 0.48,
                  "end": 2.74,
                  "spoken_at": "2025-07-04T00:28:48.000Z",
                  "text": "The playful child is curious",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913836058,
                  "realtime": true,
                  "start": 178.665003,
                  "end": 179.165003,
                  "spoken_at": "2025-07-04T00:28:49.000Z",
                  "text": "I",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:28:33.152Z"
                },
                {
                  "id": 913844658,
                  "realtime": true,
                  "start": 3.6799998,
                  "end": 4.18,
                  "spoken_at": "2025-07-04T00:28:51.000Z",
                  "text": "curiosity",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844659,
                  "realtime": true,
                  "start": 6,
                  "end": 6.5,
                  "spoken_at": "2025-07-04T00:28:54.000Z",
                  "text": "curiosity",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844660,
                  "realtime": true,
                  "start": 7.12,
                  "end": 8.58,
                  "spoken_at": "2025-07-04T00:28:55.000Z",
                  "text": "word curiosity mind.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844661,
                  "realtime": true,
                  "start": 9.28,
                  "end": 11.54,
                  "spoken_at": "2025-07-04T00:28:57.000Z",
                  "text": "Okay. Curious is not a word. I'm inventing it.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844662,
                  "realtime": true,
                  "start": 12.48,
                  "end": 14.82,
                  "spoken_at": "2025-07-04T00:29:00.000Z",
                  "text": "Curious word. Curious mind",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844663,
                  "realtime": true,
                  "start": 16.155,
                  "end": 22.494999,
                  "spoken_at": "2025-07-04T00:29:04.000Z",
                  "text": "of Gen three people doesn't exist because they have access to information in their hand",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844664,
                  "realtime": true,
                  "start": 23.435,
                  "end": 28.255001,
                  "spoken_at": "2025-07-04T00:29:11.000Z",
                  "text": "as compared to us where we had to deep learn through trial and error.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844666,
                  "realtime": true,
                  "start": 29.755001,
                  "end": 30.895,
                  "spoken_at": "2025-07-04T00:29:17.000Z",
                  "text": "Yeah. Ask people.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.956Z"
                },
                {
                  "id": 913844665,
                  "realtime": true,
                  "start": 32.85,
                  "end": 34.149998,
                  "spoken_at": "2025-07-04T00:29:20.000Z",
                  "text": "Right? Ask Internet.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.957Z"
                },
                {
                  "id": 913844667,
                  "realtime": true,
                  "start": 35.17,
                  "end": 36.629997,
                  "spoken_at": "2025-07-04T00:29:23.000Z",
                  "text": "Ask people. Yeah.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.957Z"
                },
                {
                  "id": 913844668,
                  "realtime": true,
                  "start": 40.677,
                  "end": 44.377,
                  "spoken_at": "2025-07-04T00:29:28.000Z",
                  "text": "Wait. What? I see people don't pay, so they don't",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.957Z"
                },
                {
                  "id": 913844669,
                  "realtime": true,
                  "start": 44.917,
                  "end": 45.656998,
                  "spoken_at": "2025-07-04T00:29:32.000Z",
                  "text": "they don't build up",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:29:37.957Z"
                },
                {
                  "id": 913857229,
                  "realtime": true,
                  "start": 93.1969643,
                  "end": 110.45500000000001,
                  "spoken_at": "2025-07-04T00:30:21.000Z",
                  "text": "Would reject because they never learned through. We were always required to learn through. We were always required to essentially have an open mind except new experiences. I have an open mind except okay. Okay.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:11.130Z"
                },
                {
                  "id": 913857230,
                  "realtime": true,
                  "start": 112.19500000000001,
                  "end": 112.69500000000001,
                  "spoken_at": "2025-07-04T00:30:40.000Z",
                  "text": "Yeah?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:11.131Z"
                },
                {
                  "id": 913857231,
                  "realtime": true,
                  "start": 114.435001,
                  "end": 114.935001,
                  "spoken_at": "2025-07-04T00:30:42.000Z",
                  "text": "And",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:11.131Z"
                },
                {
                  "id": 913857232,
                  "realtime": true,
                  "start": 115.47500000000001,
                  "end": 116.935001,
                  "spoken_at": "2025-07-04T00:30:43.000Z",
                  "text": "because of that, I feel",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:11.131Z"
                },
                {
                  "id": 913857233,
                  "realtime": true,
                  "start": 117.635,
                  "end": 127.25,
                  "spoken_at": "2025-07-04T00:30:45.000Z",
                  "text": "like, it makes it very difficult for me to date with that in this scenario. That's why I think a lot of the times, majority of my friends are older than me. Our my people",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:11.131Z"
                },
                {
                  "id": 913857234,
                  "realtime": true,
                  "start": 128.99,
                  "end": 131.33,
                  "spoken_at": "2025-07-04T00:30:57.000Z",
                  "text": "that I talk to, quote unquote, in a",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:11.133Z"
                },
                {
                  "id": 913857235,
                  "realtime": true,
                  "start": 133.63,
                  "end": 134.45000000000002,
                  "spoken_at": "2025-07-04T00:31:01.000Z",
                  "text": "in some sense",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:11.133Z"
                },
                {
                  "id": 913861313,
                  "realtime": true,
                  "start": 135.33,
                  "end": 159.685,
                  "spoken_at": "2025-07-04T00:31:03.000Z",
                  "text": "People that you go on date with dates with or your term friends? Yeah. Yeah. Something of those lines. Are you You can just say it like that. Why are you being so older than me. Why are you being so ambiguous about it? Because I haven't been on that many dates in LA. I mean, if it yeah. I mean, I I I understand. About that. I I And and quite frankly, it takes a lot of time.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:53.198Z"
                },
                {
                  "id": 913861314,
                  "realtime": true,
                  "start": 160.865,
                  "end": 164.085,
                  "spoken_at": "2025-07-04T00:31:28.000Z",
                  "text": "Yeah. Because so I don't I believe in, like,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:53.198Z"
                },
                {
                  "id": 913861315,
                  "realtime": true,
                  "start": 165.68,
                  "end": 167.06,
                  "spoken_at": "2025-07-04T00:31:33.000Z",
                  "text": "because of the fact that I",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:53.198Z"
                },
                {
                  "id": 913861316,
                  "realtime": true,
                  "start": 167.60000000000002,
                  "end": 173.22000000000003,
                  "spoken_at": "2025-07-04T00:31:35.000Z",
                  "text": "I built up a world model based off, like, first understanding, are you even something capable",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:53.198Z"
                },
                {
                  "id": 913861317,
                  "realtime": true,
                  "start": 175.67000000000002,
                  "end": 177.06,
                  "spoken_at": "2025-07-04T00:31:43.000Z",
                  "text": "of maintaining something",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:31:53.198Z"
                },
                {
                  "id": 913865948,
                  "realtime": true,
                  "start": 177.77999997,
                  "end": 195.385,
                  "spoken_at": "2025-07-04T00:31:45.000Z",
                  "text": "That is start let's start with the fucking friendship and then move on to something else. And it takes a lot of time. Yes. It takes a lot of effort from both ends. And a lot of the times, majority of majority of the days that I have been on, they don't want to do that effort, and I'm willing to do that effort.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:32:36.236Z"
                },
                {
                  "id": 913865949,
                  "realtime": true,
                  "start": 196.005,
                  "end": 199.145001,
                  "spoken_at": "2025-07-04T00:32:04.000Z",
                  "text": "Yeah. They just want their relationship to build itself kind of.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:32:36.236Z"
                },
                {
                  "id": 913865950,
                  "realtime": true,
                  "start": 200.245001,
                  "end": 203.705,
                  "spoken_at": "2025-07-04T00:32:08.000Z",
                  "text": "Yeah. And I'm like No. Like, they they want the outcome. Requires effort.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:32:36.236Z"
                },
                {
                  "id": 913865951,
                  "realtime": true,
                  "start": 206.696665,
                  "end": 209.09,
                  "spoken_at": "2025-07-04T00:32:14.000Z",
                  "text": "Yeah. Anything requires effort. Yeah. And and I feel like there's also, like, this",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:32:36.236Z"
                },
                {
                  "id": 913865952,
                  "realtime": true,
                  "start": 209.63,
                  "end": 210.85,
                  "spoken_at": "2025-07-04T00:32:17.000Z",
                  "text": "at least, like, I think",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:32:36.237Z"
                },
                {
                  "id": 913865953,
                  "realtime": true,
                  "start": 211.54999800000002,
                  "end": 215.33,
                  "spoken_at": "2025-07-04T00:32:19.000Z",
                  "text": "that the this information, what you're describing, like, we know everything.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:32:36.237Z"
                },
                {
                  "id": 913870227,
                  "realtime": true,
                  "start": 218.37,
                  "end": 231.00500000000002,
                  "spoken_at": "2025-07-04T00:32:26.000Z",
                  "text": "There's this thing where, like I remember a friend who was telling me about his relationship, and then he was like, oh, yeah. My girlfriend, like, she went to basically, she went to a therapist, and she started telling the therapist a lot of shit about",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.788Z"
                },
                {
                  "id": 913870228,
                  "realtime": true,
                  "start": 232.25833300000002,
                  "end": 233.425,
                  "spoken_at": "2025-07-04T00:32:40.000Z",
                  "text": "him. And then the therapist",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.789Z"
                },
                {
                  "id": 913870229,
                  "realtime": true,
                  "start": 234.04500000000002,
                  "end": 240.38500000000002,
                  "spoken_at": "2025-07-04T00:32:42.000Z",
                  "text": "was essentially dictating their relationship, and then she was like, oh, because my therapist told me that you need to do that. You need to do that. Yep.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.789Z"
                },
                {
                  "id": 913870231,
                  "realtime": true,
                  "start": 241.085001,
                  "end": 247.74,
                  "spoken_at": "2025-07-04T00:32:49.000Z",
                  "text": "So she wanted to the relationship to be fixed, but she didn't want to basically, she wanted to come with receipts and have them",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.789Z"
                },
                {
                  "id": 913870233,
                  "realtime": true,
                  "start": 248.28000000000003,
                  "end": 253.26000000000002,
                  "spoken_at": "2025-07-04T00:32:56.000Z",
                  "text": "execute the orders from the therapist. It's like, no. You have to invest in creating an understanding",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.789Z"
                },
                {
                  "id": 913870230,
                  "realtime": true,
                  "start": 253.8,
                  "end": 255.34,
                  "spoken_at": "2025-07-04T00:33:01.000Z",
                  "text": "of the other person as well.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.789Z"
                },
                {
                  "id": 913870235,
                  "realtime": true,
                  "start": 256.04,
                  "end": 256.54,
                  "spoken_at": "2025-07-04T00:33:04.000Z",
                  "text": "Yeah.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.789Z"
                },
                {
                  "id": 913870232,
                  "realtime": true,
                  "start": 258.742937,
                  "end": 259.922937,
                  "spoken_at": "2025-07-04T00:33:06.000Z",
                  "text": "And so",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:33:13.790Z"
                },
                {
                  "id": 913879885,
                  "realtime": true,
                  "start": 307.112,
                  "end": 313.692,
                  "spoken_at": "2025-07-04T00:33:55.000Z",
                  "text": "Example that you told me. Right? No. Where does it stem from? It stems from the fact that majority of that person's",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:34:45.060Z"
                },
                {
                  "id": 913879886,
                  "realtime": true,
                  "start": 315.032,
                  "end": 328.987,
                  "spoken_at": "2025-07-04T00:34:03.000Z",
                  "text": "information ingestion came from Internet, means, or I don't know. Other form My friend also mentioned that that he hates the and she she does that, his ex girlfriend. That she goes on these, like you know the reels where it's like a therapist giving a TikTok?",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:34:45.060Z"
                },
                {
                  "id": 913879887,
                  "realtime": true,
                  "start": 329.527,
                  "end": 333.867,
                  "spoken_at": "2025-07-04T00:34:17.000Z",
                  "text": "And they take that as, like, true oh, yeah. You're like this. My boyfriend's like this.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:34:45.060Z"
                },
                {
                  "id": 913879888,
                  "realtime": true,
                  "start": 335.672001,
                  "end": 345.852,
                  "spoken_at": "2025-07-04T00:34:23.000Z",
                  "text": "Yeah. So they don't want to do that extra effort of thinking. Does this even does this even relate to me, or does this even describe me and my boyfriend?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:34:45.060Z"
                },
                {
                  "id": 913882625,
                  "realtime": true,
                  "start": 346.53199995,
                  "end": 352.99199999999996,
                  "spoken_at": "2025-07-04T00:34:34.000Z",
                  "text": "Right. Or my my partner, they don't even want to do that effort. And this is exactly what I mean by knowledge maturity",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.340Z"
                },
                {
                  "id": 913882626,
                  "realtime": true,
                  "start": 354.81199999999995,
                  "end": 356.352,
                  "spoken_at": "2025-07-04T00:34:42.000Z",
                  "text": "as compared to experience",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.340Z"
                },
                {
                  "id": 913882627,
                  "realtime": true,
                  "start": 356.892,
                  "end": 357.87199949999996,
                  "spoken_at": "2025-07-04T00:34:44.000Z",
                  "text": "experience based maturity.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882628,
                  "realtime": true,
                  "start": 359.30699999999996,
                  "end": 361.16700099999997,
                  "spoken_at": "2025-07-04T00:34:47.000Z",
                  "text": "Experience based maturity is about",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882629,
                  "realtime": true,
                  "start": 361.86699999999996,
                  "end": 362.36699999999996,
                  "spoken_at": "2025-07-04T00:34:49.000Z",
                  "text": "experimenting.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882630,
                  "realtime": true,
                  "start": 362.907,
                  "end": 363.407,
                  "spoken_at": "2025-07-04T00:34:50.000Z",
                  "text": "It's",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882631,
                  "realtime": true,
                  "start": 363.947001,
                  "end": 366.767,
                  "spoken_at": "2025-07-04T00:34:52.000Z",
                  "text": "it's not collecting receipts. It's basically collecting",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882632,
                  "realtime": true,
                  "start": 367.467,
                  "end": 367.967,
                  "spoken_at": "2025-07-04T00:34:55.000Z",
                  "text": "data,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882633,
                  "realtime": true,
                  "start": 368.827,
                  "end": 369.327,
                  "spoken_at": "2025-07-04T00:34:56.000Z",
                  "text": "whereas",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882634,
                  "realtime": true,
                  "start": 369.947001,
                  "end": 370.447001,
                  "spoken_at": "2025-07-04T00:34:58.000Z",
                  "text": "information",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882635,
                  "realtime": true,
                  "start": 371.147,
                  "end": 374.04699999999997,
                  "spoken_at": "2025-07-04T00:34:59.000Z",
                  "text": "based maturity is essentially collecting receipts, not data.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882636,
                  "realtime": true,
                  "start": 376.912,
                  "end": 379.572,
                  "spoken_at": "2025-07-04T00:35:04.000Z",
                  "text": "That's a nice way of putting things. Nice.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882637,
                  "realtime": true,
                  "start": 380.832,
                  "end": 381.072,
                  "spoken_at": "2025-07-04T00:35:08.000Z",
                  "text": "Well",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882638,
                  "realtime": true,
                  "start": 387.099,
                  "end": 388.63899999999995,
                  "spoken_at": "2025-07-04T00:35:15.000Z",
                  "text": "Yeah. And and",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913882639,
                  "realtime": true,
                  "start": 390.13899999999995,
                  "end": 392.159,
                  "spoken_at": "2025-07-04T00:35:18.000Z",
                  "text": "everybody has to do certain level of",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:35:25.341Z"
                },
                {
                  "id": 913886095,
                  "realtime": true,
                  "start": 393.039,
                  "end": 401.539,
                  "spoken_at": "2025-07-04T00:35:21.000Z",
                  "text": "Okay. I also believe in the fact that not everybody needs can give, like, four hours of their life just to starting about",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.182Z"
                },
                {
                  "id": 913886096,
                  "realtime": true,
                  "start": 402.079,
                  "end": 405.139,
                  "spoken_at": "2025-07-04T00:35:30.000Z",
                  "text": "stuff. I agree with that. Everybody has a different life.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913886097,
                  "realtime": true,
                  "start": 405.758999,
                  "end": 406.258999,
                  "spoken_at": "2025-07-04T00:35:33.000Z",
                  "text": "But",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913886098,
                  "realtime": true,
                  "start": 407.324,
                  "end": 416.06399899999997,
                  "spoken_at": "2025-07-04T00:35:35.000Z",
                  "text": "that only comes that level of understanding only comes if you have initially spent hours and hours and hours of time",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913886099,
                  "realtime": true,
                  "start": 417.644,
                  "end": 419.344,
                  "spoken_at": "2025-07-04T00:35:45.000Z",
                  "text": "communicating, talking to one another,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913886100,
                  "realtime": true,
                  "start": 420.629,
                  "end": 422.089,
                  "spoken_at": "2025-07-04T00:35:48.000Z",
                  "text": "tick tracking instance.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913886101,
                  "realtime": true,
                  "start": 427.109,
                  "end": 429.929,
                  "spoken_at": "2025-07-04T00:35:55.000Z",
                  "text": "Yeah. I mean, like, I feel like it's, like, everything.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913886102,
                  "realtime": true,
                  "start": 431.14099999999996,
                  "end": 433.401,
                  "spoken_at": "2025-07-04T00:35:59.000Z",
                  "text": "Yeah. Mhmm. You gotta just gotta do it more.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913886103,
                  "realtime": true,
                  "start": 434.82099999999997,
                  "end": 435.32099999999997,
                  "spoken_at": "2025-07-04T00:36:02.000Z",
                  "text": "Yep.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:11.183Z"
                },
                {
                  "id": 913889043,
                  "realtime": true,
                  "start": 437.801,
                  "end": 442.061,
                  "spoken_at": "2025-07-04T00:36:05.000Z",
                  "text": "And, like, for for me, honestly, like, the the communication part, which I'm not really",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.268Z"
                },
                {
                  "id": 913889044,
                  "realtime": true,
                  "start": 442.921,
                  "end": 444.621,
                  "spoken_at": "2025-07-04T00:36:10.000Z",
                  "text": "like, I'm good at, like, ret",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.268Z"
                },
                {
                  "id": 913889045,
                  "realtime": true,
                  "start": 445.40099999999995,
                  "end": 449.66099999999994,
                  "spoken_at": "2025-07-04T00:36:13.000Z",
                  "text": "rhetorical, like, you know, giving a speech at the UN type like, right you know what I mean? That type of thing.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889046,
                  "realtime": true,
                  "start": 450.20599899999996,
                  "end": 452.305999,
                  "spoken_at": "2025-07-04T00:36:18.000Z",
                  "text": "But I'm I'm not the best at communicating.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889047,
                  "realtime": true,
                  "start": 452.96599999999995,
                  "end": 453.46599999999995,
                  "spoken_at": "2025-07-04T00:36:21.000Z",
                  "text": "Mhmm.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889048,
                  "realtime": true,
                  "start": 454.126,
                  "end": 456.306,
                  "spoken_at": "2025-07-04T00:36:22.000Z",
                  "text": "And and part of that is part",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889049,
                  "realtime": true,
                  "start": 457.126,
                  "end": 458.54599799999994,
                  "spoken_at": "2025-07-04T00:36:25.000Z",
                  "text": "honestly, part of the",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889050,
                  "realtime": true,
                  "start": 459.565999,
                  "end": 470.101,
                  "spoken_at": "2025-07-04T00:36:27.000Z",
                  "text": "me realizing that I'm not good at is that I looked at a lot of things. I'm like, am I getting what I want? Do people understand me? No. Okay. Maybe there's something that I I I need",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889051,
                  "realtime": true,
                  "start": 470.801,
                  "end": 471.301,
                  "spoken_at": "2025-07-04T00:36:38.000Z",
                  "text": "to",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889052,
                  "realtime": true,
                  "start": 472.001,
                  "end": 477.22099999999995,
                  "spoken_at": "2025-07-04T00:36:40.000Z",
                  "text": "to work on. But, also, like, my out my my personal understanding of, like,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913889053,
                  "realtime": true,
                  "start": 479.751,
                  "end": 481.09099999999995,
                  "spoken_at": "2025-07-04T00:36:47.000Z",
                  "text": "relationships and conversations",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:36:54.269Z"
                },
                {
                  "id": 913894061,
                  "realtime": true,
                  "start": 482.01099995999994,
                  "end": 483.35099999999994,
                  "spoken_at": "2025-07-04T00:36:50.000Z",
                  "text": "Is a lot more centered",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894062,
                  "realtime": true,
                  "start": 484.53099999999995,
                  "end": 485.03099999999995,
                  "spoken_at": "2025-07-04T00:36:52.000Z",
                  "text": "around",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894063,
                  "realtime": true,
                  "start": 486.21099999999996,
                  "end": 487.59099999999995,
                  "spoken_at": "2025-07-04T00:36:54.000Z",
                  "text": "making basically, giving",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894064,
                  "realtime": true,
                  "start": 488.131,
                  "end": 493.83099999999996,
                  "spoken_at": "2025-07-04T00:36:56.000Z",
                  "text": "making sure making it so that the conversation is a net positive for both sides",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894065,
                  "realtime": true,
                  "start": 494.51599899999997,
                  "end": 501.09599999999995,
                  "spoken_at": "2025-07-04T00:37:02.000Z",
                  "text": "more than the outcome of the conversation. Yeah. Or, like, some",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894066,
                  "realtime": true,
                  "start": 501.79599999999994,
                  "end": 503.17599999999993,
                  "spoken_at": "2025-07-04T00:37:09.000Z",
                  "text": "basically, I'm less specific,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894067,
                  "realtime": true,
                  "start": 504.03599999999994,
                  "end": 507.09599999999995,
                  "spoken_at": "2025-07-04T00:37:12.000Z",
                  "text": "and I have more Yeah. I leave more room. You know?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894068,
                  "realtime": true,
                  "start": 508.89100099999996,
                  "end": 515.751004,
                  "spoken_at": "2025-07-04T00:37:16.000Z",
                  "text": "It's more about having a conversion rather than winning and losing in our conversions. Yes. And I'm that's my",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894069,
                  "realtime": true,
                  "start": 516.411,
                  "end": 520.4309999999999,
                  "spoken_at": "2025-07-04T00:37:24.000Z",
                  "text": "I know. That's That's why my my way what's my way of thinking for several years?",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913894070,
                  "realtime": true,
                  "start": 522.396,
                  "end": 523.976,
                  "spoken_at": "2025-07-04T00:37:30.000Z",
                  "text": "Right. And still somewhat is.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:37:39.251Z"
                },
                {
                  "id": 913897320,
                  "realtime": true,
                  "start": 524.37599998,
                  "end": 527.036,
                  "spoken_at": "2025-07-04T00:37:32.000Z",
                  "text": "It's kind of one of those things that it's hard to",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:38:22.072Z"
                },
                {
                  "id": 913897321,
                  "realtime": true,
                  "start": 527.8959998,
                  "end": 538.716,
                  "spoken_at": "2025-07-04T00:37:35.000Z",
                  "text": "shake out of you. That that is exactly how things need to be. You don't need to have a winning or a losing. You cannot have a conversation if you are thinking about winning or losing the conversation.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.072Z"
                },
                {
                  "id": 913897322,
                  "realtime": true,
                  "start": 540.411,
                  "end": 541.551,
                  "spoken_at": "2025-07-04T00:37:48.000Z",
                  "text": "Yeah. It's always",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.073Z"
                },
                {
                  "id": 913897323,
                  "realtime": true,
                  "start": 542.091,
                  "end": 543.711,
                  "spoken_at": "2025-07-04T00:37:50.000Z",
                  "text": "about having a",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.073Z"
                },
                {
                  "id": 913897324,
                  "realtime": true,
                  "start": 544.491,
                  "end": 547.231,
                  "spoken_at": "2025-07-04T00:37:52.000Z",
                  "text": "neutral having respecting other people's opinion.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.073Z"
                },
                {
                  "id": 913897325,
                  "realtime": true,
                  "start": 548.251,
                  "end": 556.196,
                  "spoken_at": "2025-07-04T00:37:56.000Z",
                  "text": "Wise but not about opinion. It was more about the fact that you are having a conversation rather than a duplicate. Because in the card, you can win or lose.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.074Z"
                },
                {
                  "id": 913897326,
                  "realtime": true,
                  "start": 557.215998,
                  "end": 557.715998,
                  "spoken_at": "2025-07-04T00:38:05.000Z",
                  "text": "Right.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.074Z"
                },
                {
                  "id": 913897327,
                  "realtime": true,
                  "start": 558.256,
                  "end": 559.316,
                  "spoken_at": "2025-07-04T00:38:06.000Z",
                  "text": "And in a conversation,",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.074Z"
                },
                {
                  "id": 913897328,
                  "realtime": true,
                  "start": 559.936,
                  "end": 561.636,
                  "spoken_at": "2025-07-04T00:38:07.000Z",
                  "text": "you can just leave where it is.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.074Z"
                },
                {
                  "id": 913897329,
                  "realtime": true,
                  "start": 562.991,
                  "end": 565.251,
                  "spoken_at": "2025-07-04T00:38:11.000Z",
                  "text": "And that was the remember? Okay.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.074Z"
                },
                {
                  "id": 913897330,
                  "realtime": true,
                  "start": 566.191,
                  "end": 567.331,
                  "spoken_at": "2025-07-04T00:38:14.000Z",
                  "text": "I'll get a callback",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:38:22.074Z"
                },
                {
                  "id": 913900723,
                  "realtime": true,
                  "start": 568.13099995,
                  "end": 575.831,
                  "spoken_at": "2025-07-04T00:38:16.000Z",
                  "text": "To to the experiences that we both shared. It's essentially remember the time when I told you, I would essentially probably get those shit on",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:39:05.342Z"
                },
                {
                  "id": 913900724,
                  "realtime": true,
                  "start": 576.611,
                  "end": 579.191,
                  "spoken_at": "2025-07-04T00:38:24.000Z",
                  "text": "some some random show or Yes.",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:39:05.343Z"
                },
                {
                  "id": 913900725,
                  "realtime": true,
                  "start": 580.506,
                  "end": 583.085999,
                  "spoken_at": "2025-07-04T00:38:28.000Z",
                  "text": "Yeah. Very do it for you. Very unpleasant conversation,",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:39:05.343Z"
                },
                {
                  "id": 913900726,
                  "realtime": true,
                  "start": 584.0260000000001,
                  "end": 585.726,
                  "spoken_at": "2025-07-04T00:38:32.000Z",
                  "text": "and a big part of that was my",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:39:05.343Z"
                },
                {
                  "id": 913900727,
                  "realtime": true,
                  "start": 586.985999,
                  "end": 587.066,
                  "spoken_at": "2025-07-04T00:38:35.000Z",
                  "text": "doing.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:39:05.343Z"
                },
                {
                  "id": 913900728,
                  "realtime": true,
                  "start": 588.0260000000001,
                  "end": 591.6459990000001,
                  "spoken_at": "2025-07-04T00:38:36.000Z",
                  "text": "Very uncomfortable conversation, and a big part of that was my doing.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:39:05.343Z"
                },
                {
                  "id": 913900729,
                  "realtime": true,
                  "start": 592.426,
                  "end": 593.886,
                  "spoken_at": "2025-07-04T00:38:40.000Z",
                  "text": "I recognize that.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:39:05.343Z"
                },
                {
                  "id": 913900730,
                  "realtime": true,
                  "start": 595.386,
                  "end": 598.181,
                  "spoken_at": "2025-07-04T00:38:43.000Z",
                  "text": "Yes. Like, I I could have just been like, okay. Whatever.",
                  "speaker": "1",
                  "created_at": "2025-07-04T00:39:05.343Z"
                },
                {
                  "id": 913900731,
                  "realtime": true,
                  "start": 599.601,
                  "end": 605.301,
                  "spoken_at": "2025-07-04T00:38:47.000Z",
                  "text": "Exactly. No. I completely understand of where you are coming from. And I also have the same thought that you",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:39:05.346Z"
                },
                {
                  "id": 913900732,
                  "realtime": true,
                  "start": 606.333003,
                  "end": 606.833003,
                  "spoken_at": "2025-07-04T00:38:54.000Z",
                  "text": "It's",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:39:05.346Z"
                },
                {
                  "id": 913900733,
                  "realtime": true,
                  "start": 607.613,
                  "end": 609.393,
                  "spoken_at": "2025-07-04T00:38:55.000Z",
                  "text": "not current to buy that stuff,",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:39:05.347Z"
                },
                {
                  "id": 913900734,
                  "realtime": true,
                  "start": 610.013003,
                  "end": 610.513003,
                  "spoken_at": "2025-07-04T00:38:58.000Z",
                  "text": "but",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:39:05.347Z"
                },
                {
                  "id": 913900735,
                  "realtime": true,
                  "start": 611.053,
                  "end": 613.073,
                  "spoken_at": "2025-07-04T00:38:59.000Z",
                  "text": "there is always an asterisk",
                  "speaker": "0",
                  "created_at": "2025-07-04T00:39:05.347Z"
                }
              ]
            }
          ],
          "suggested_links": [],
          "primary_location": {
            "address": "3658 S Sepulveda Blvd, Los Angeles, Palms, CA, Los Angeles County, 90034, United States",
            "latitude": 34.01618367452903,
            "longitude": -118.41900266928403,
            "created_at": "2025-07-03T23:58:15.290Z"
          }
        }
      }
      ```
- **DELETE /v1/{userId}/conversations/{id}**

```
curl -X 'DELETE' \
  'https://api.bee.computer/v1/me/conversations/3440923' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-202dcfa9eb31ab6b8c08815a184a551280e7e9793dd00dca'
```

- - **https://api.bee.computer/v1/me/conversations/3440923** (https://api.bee.computer/v1/me/conversations/3440923)
    - Example API output:

      ```
      {
        "success": true
      }
      ```
- **POST /v1/{userId}/conversations/{id}/end**

```
curl -X 'POST' \
  'https://api.bee.computer/v1/me/conversations/3440923/end' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-202dcfa9eb31ab6b8c08815a184a551280e7e9793dd00dca' \
  -d ''
```

- **POST /v1/{userId}/conversations/{id}/retry**

```
curl -X 'POST' \
  'https://api.bee.computer/v1/me/conversations/344923/retry' \
  -H 'accept: application/json' \
  -H 'x-api-key: sk-202dcfa9eb31ab6b8c08815a184a551280e7e9793dd00dca' \
  -d ''	
```

- - **https://api.bee.computer/v1/me/conversations/344923/retry** (https://api.bee.computer/v1/me/conversations/344923/retry)
    - Example API output:

      ```
      {
        "error": "Conversation not found"
      }
      ```

***

```
{
"swagger": "2.0",
"info": {
"title": "Conversation API",
"version": "1.0.0",
"description": "API for managing conversations"
},
"host": "api.bee.computer",
"basePath": "/",
"schemes": [
"https"
],
"paths": {
"/v1/{userId}/conversations": {
"get": {
"summary": "Get summaries of all conversations for a user with paging",
"parameters": [
{
"in": "path",
"name": "userId",
"schema": {
"type": "string",
"example": "me"
},
"required": true,
"description": "ID of the user (currently only supports 'me')"
},
{
"in": "query",
"name": "page",
"schema": {
"type": "integer"
},
"description": "Page number"
},
{
"in": "query",
"name": "limit",
"schema": {
"type": "integer"
},
"description": "Number of items per page"
}
],
"responses": {
"200": {
"description": "A paginated list of conversation summaries"
},
"401": {
"description": "Unauthorized"
}
}
}
},
"/v1/{userId}/conversations/{id}": {
"get": {
"summary": "Get a specific conversation for a user",
"parameters": [
{
"in": "path",
"name": "userId",
"schema": {
"type": "string",
"example": "me"
},
"required": true,
"description": "ID of the user (currently only supports 'me')"
},
{
"in": "path",
"name": "id",
"schema": {
"type": "integer",
"default": 1
},
"required": true,
"description": "ID of the conversation"
}
],
"responses": {
"200": {
"description": "The requested conversation"
},
"400": {
"description": "Invalid conversation ID"
},
"401": {
"description": "Unauthorized"
},
"404": {
"description": "Conversation not found"
}
}
},
"delete": {
"summary": "Delete a specific conversation for a user",
"parameters": [
{
"in": "path",
"name": "userId",
"schema": {
"type": "string",
"example": "me"
},
"required": true,
"description": "ID of the user (currently only supports 'me')"
},
{
"in": "path",
"name": "id",
"schema": {
"type": "integer",
"default": 1
},
"required": true,
"description": "ID of the conversation"
}
],
"responses": {
"200": {
"description": "The deleted conversation"
},
"401": {
"description": "Unauthorized"
},
"404": {
"description": "Conversation not found"
}
}
}
},
"/v1/{userId}/conversations/{id}/end": {
"post": {
"summary": "End a specific conversation for a user",
"parameters": [
{
"in": "path",
"name": "userId",
"schema": {
"type": "string",
"example": "me"
},
"required": true,
"description": "ID of the user (currently only supports 'me')"
},
{
"in": "path",
"name": "id",
"schema": {
"type": "integer",
"default": 1
},
"required": true,
"description": "ID of the conversation"
}
],
"responses": {
"200": {
"description": "The ended conversation"
},
"401": {
"description": "Unauthorized"
},
"404": {
"description": "Conversation not found"
}
}
}
},
"/v1/{userId}/conversations/{id}/retry": {
"post": {
"summary": "Retry a specific conversation for a user",
"parameters": [
{
"in": "path",
"name": "userId",
"schema": {
"type": "string",
"example": "me"
},
"required": true,
"description": "ID of the user (currently only supports 'me')"
},
{
"in": "path",
"name": "id",
"schema": {
"type": "integer",
"default": 1
},
"required": true,
"description": "ID of the conversation"
}
],
"responses": {
"200": {
"description": "OK"
},
"401": {
"description": "Unauthorized"
},
"404": {
"description": "Conversation not found"
}
}
}
}
}
}
```