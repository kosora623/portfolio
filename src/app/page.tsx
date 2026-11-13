'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import ParticleBackground from '@/components/ParticleBackground';
import { socialIcons } from '@/components/socialIcons';
import { socialLinks } from '@/data/site';
import { hero, about, skills, interests, hobbies } from '@/data/profile';

export default function HomePage() {
  const MotionLink = motion.create(Link);
  const listContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };
  const heroItemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const [aboutRef, aboutInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [interestsRef, interestsInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [hobbiesRef, hobbiesInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [socialsRef, socialsInView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <>
      <div className="relative h-screen flex flex-col justify-center">
        <ParticleBackground />
        <motion.div className="relative z-10" variants={listContainerVariants} initial="hidden" animate="visible">
          <motion.p variants={heroItemVariants} className="text-teal mb-4 text-lg">{hero.greeting}</motion.p>
          <motion.h1 variants={heroItemVariants} className="text-5xl md:text-7xl font-extrabold text-light-slate mb-2">{hero.title}</motion.h1>
          <motion.h2 variants={heroItemVariants} className="text-4xl md:text-6xl font-bold text-slate mb-8">{hero.subtitle}</motion.h2>
          <motion.p variants={heroItemVariants} className="max-w-xl text-lg mb-10">{hero.roles}</motion.p>
          <motion.div variants={heroItemVariants}>
            <MotionLink
              href="/works"
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ duration: 0.18 }}
              className="px-8 py-3 border border-teal text-teal font-bold rounded transition-all duration-200 transform hover:bg-teal/10 inline-block"
            >
              Works
            </MotionLink>
          </motion.div>
        </motion.div>
      </div>
      <motion.section ref={aboutRef} variants={sectionVariants} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'} className="py-24" id="about">
        <h2 className="text-3xl font-bold text-light-slate mb-8 flex items-center"><span className="text-teal font-mono mr-3">01.</span>About Me<span className="flex-grow ml-4 h-px bg-slate/30"></span></h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-3 text-slate text-lg space-y-4">
            <p>{about.intro}</p>
            <p className="font-mono text-light-slate mt-6">{about.skillsLabel}</p>
            <div className="flex flex-wrap gap-3 pt-4">
              {skills.map((skill) => (
                <div key={skill} className="px-4 py-2 bg-slate/10 border border-slate/20 rounded-full text-sm font-mono text-teal">{skill}</div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 relative w-full max-w-xs mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal to-blue-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-navy rounded-lg p-1">
                <Image src={about.profileImage.src} alt={about.profileImage.alt} width={about.profileImage.width} height={about.profileImage.height} className="rounded-md w-full" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        ref={interestsRef}
        variants={sectionVariants}
        initial="hidden"
        animate={interestsInView ? 'visible' : 'hidden'}
        className="py-24"
        id="interests"
      >
        <h2 className="text-3xl font-bold text-light-slate mb-12 flex items-center">
          <span className="text-teal font-mono mr-3">02.</span>
          Interests
          <span className="flex-grow ml-4 h-px bg-slate/30"></span>
        </h2>
        <div className="max-w-2xl space-y-8">
          {interests.map((interest) => (
            <div key={interest.title}>
              <h3 className="text-xl font-bold text-light-slate mb-1 flex items-center">
                <span className="text-teal mr-3">・</span>
                {interest.title}
              </h3>
              <p className="text-slate pl-7">{interest.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        ref={hobbiesRef}
        variants={sectionVariants}
        initial="hidden"
        animate={hobbiesInView ? 'visible' : 'hidden'}
        className="py-24"
        id="hobbies"
      >
        <h2 className="text-3xl font-bold text-light-slate mb-12 flex items-center">
          <span className="text-teal font-mono mr-3">03.</span>
          Hobbies
          <span className="flex-grow ml-4 h-px bg-slate/30"></span>
        </h2>
        <div className="max-w-2xl space-y-8">
          {hobbies.map((hobby) => (
            <div key={hobby.title}>
              <h3 className="text-xl font-bold text-light-slate mb-1 flex items-center">
                <span className="text-teal mr-3">・</span>
                {hobby.title}
              </h3>
              <p className="text-slate pl-7">{hobby.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section ref={socialsRef} variants={sectionVariants} initial="hidden" animate={socialsInView ? 'visible' : 'hidden'} className="py-24 text-center" id="socials">
        <h2 className="text-3xl font-bold text-light-slate mb-12">
          <span className="text-teal font-mono text-2xl block mb-3">04.</span>
          各種SNS
        </h2>
        <motion.div 
          className="max-w-sm mx-auto"
          variants={listContainerVariants}
          initial="hidden"
          animate={socialsInView ? "visible" : "hidden"}
        >
          {socialLinks.map((link) => {
            const Icon = socialIcons[link.icon];
            return (
              <motion.a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="group flex items-center p-4 border-b border-slate/20 transition-all duration-200 hover:bg-slate/5 hover:scale-105" variants={heroItemVariants}>
                <Icon className="text-3xl text-slate group-hover:text-teal transition-all duration-200" />
                <div className="ml-5 text-left">
                  <p className="text-sm text-slate">{link.name}</p>
                  <p className="text-lg font-mono text-light-slate">{link.handle}</p>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      </motion.section>
    </>
  );
}