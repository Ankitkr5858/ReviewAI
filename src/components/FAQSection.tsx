import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'pricing' | 'security';
}

const FAQSection: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqs: FAQ[] = [
    // General Questions
    {
      question: "What is ReviewAI?",
      answer: "ReviewAI is an AI-powered code review platform that automatically analyzes your code for bugs, security vulnerabilities, and code quality issues. It integrates with GitHub, GitLab, and Bitbucket to provide instant feedback on your code, helping you improve quality and catch issues before they reach production.",
      category: "general"
    },
    {
      question: "Which programming languages does ReviewAI support?",
      answer: "ReviewAI currently supports JavaScript, TypeScript, Python, Java, C++, C#, Go, Ruby, PHP, and Rust. We're continuously expanding our language support based on user feedback and demand.",
      category: "general"
    },
    {
      question: "How does ReviewAI compare to human code reviews?",
      answer: "While ReviewAI doesn't replace the strategic thinking of human reviewers, it excels at catching technical issues, enforcing coding standards, and identifying security vulnerabilities that humans might miss. It's designed to complement human reviews by handling the repetitive aspects, allowing your team to focus on architecture and design decisions.",
      category: "general"
    },
    {
      question: "How long does it take to set up ReviewAI?",
      answer: "Setting up ReviewAI takes just 2 minutes. Simply connect your GitHub account, provide your OpenAI API key, and you're ready to start reviewing code. There's no complex configuration required to get started.",
      category: "general"
    },
    
    // Technical Questions
    {
      question: "How does ReviewAI integrate with GitHub?",
      answer: "ReviewAI integrates with GitHub through a secure connection using your personal access token. Once connected, it can automatically review pull requests, analyze your repositories, and provide feedback directly in your GitHub workflow. It respects your repository permissions and only accesses what you've authorized.",
      category: "technical"
    },
    {
      question: "What types of issues can ReviewAI detect?",
      answer: "ReviewAI can detect a wide range of issues including security vulnerabilities (like XSS and SQL injection), performance bottlenecks, code quality issues, potential bugs, and best practice violations. It analyzes both the code structure and logic to provide comprehensive feedback.",
      category: "technical"
    },
    {
      question: "How does the auto-fix feature work?",
      answer: "The auto-fix feature uses AI to automatically generate fixes for common issues like formatting problems, missing semicolons, and simple bugs. When ReviewAI identifies a fixable issue, it suggests a solution that you can apply with one click. For more complex issues, it provides detailed explanations to help you implement the fix manually.",
      category: "technical"
    },
    {
      question: "Can I customize the review rules?",
      answer: "Yes, ReviewAI allows you to customize review rules to match your team's coding standards and preferences. You can adjust the severity levels of different issue types, disable specific rules, and even create custom rules tailored to your project's needs.",
      category: "technical"
    },
    {
      question: "How does ReviewAI handle large repositories?",
      answer: "ReviewAI is designed to efficiently handle repositories of any size. For large repositories, it focuses on analyzing changed files and lines rather than the entire codebase, ensuring quick and relevant feedback even for massive projects.",
      category: "technical"
    },
    
    // Pricing Questions
    {
      question: "Is ReviewAI really free?",
      answer: "Yes, ReviewAI offers a completely free tier that includes essential features for individual developers and small teams. You can connect repositories, run code reviews, and get AI-powered suggestions without any cost. We believe in making code quality accessible to everyone.",
      category: "pricing"
    },
    {
      question: "What are the limitations of the free tier?",
      answer: "The free tier includes all core features but has some usage limits. You can connect up to 3 repositories, run up to 100 reviews per month, and access basic analytics. For unlimited usage and advanced features, you can upgrade to our Pro or Team plans.",
      category: "pricing"
    },
    {
      question: "Do I need to provide payment information to use the free tier?",
      answer: "No, you don't need to provide any payment information to use ReviewAI's free tier. Simply sign up with your GitHub account and you can start using the platform immediately without entering any credit card details.",
      category: "pricing"
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to additional features. When downgrading, your current plan will remain active until the end of your billing cycle.",
      category: "pricing"
    },
    
    // Security Questions
    {
      question: "How secure is my code with ReviewAI?",
      answer: "Your code security is our top priority. ReviewAI processes your code in secure, isolated environments and never stores your code permanently. All data transmission is encrypted using industry-standard protocols, and we adhere to strict security practices to protect your intellectual property.",
      category: "security"
    },
    {
      question: "Does ReviewAI store my code?",
      answer: "No, ReviewAI does not store your code permanently. Your code is processed in memory for analysis and then immediately discarded. We only retain metadata about the issues found (without the actual code) to provide analytics and improve our service.",
      category: "security"
    },
    {
      question: "What permissions does ReviewAI need for my GitHub account?",
      answer: "ReviewAI requires read access to your repositories to analyze code, and comment access to provide feedback on pull requests. We follow the principle of least privilege and only request the permissions necessary to provide our service. You can review and revoke these permissions at any time from your GitHub settings.",
      category: "security"
    },
    {
      question: "How does ReviewAI compare to CodeRabbit and other AI code review tools?",
      answer: "Unlike CodeRabbit which focuses primarily on PR comments, ReviewAI offers a more comprehensive solution with auto-fix capabilities, performance analysis, and support for multiple Git providers. While CodeRabbit and Codeant AI are excellent tools, ReviewAI differentiates itself with broader language support, deeper security scanning, and a completely free tier that doesn't compromise on essential features.",
      category: "general"
    },
    {
      question: "What makes ReviewAI better than traditional code analysis tools like SonarQube?",
      answer: "Unlike traditional tools like SonarQube that rely on predefined rules, ReviewAI uses advanced AI to understand code context and provide more intelligent, relevant feedback. It can identify subtle issues that rule-based systems miss, explain problems in plain language, and suggest fixes that consider the broader codebase. Additionally, ReviewAI's setup takes minutes compared to SonarQube's more complex configuration process.",
      category: "general"
    },
    {
      question: "How does ReviewAI handle false positives compared to other tools?",
      answer: "ReviewAI significantly reduces false positives compared to tools like CodeMetrics and Qodo.ai by using context-aware AI that understands your specific codebase. Our models are trained to recognize intentional patterns versus actual issues, and our feedback system continuously improves accuracy based on user responses. This results in more relevant, actionable feedback with fewer distractions.",
      category: "technical"
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions', count: faqs.length },
    { id: 'general', label: 'General', count: faqs.filter(f => f.category === 'general').length },
    { id: 'technical', label: 'Technical', count: faqs.filter(f => f.category === 'technical').length },
    { id: 'pricing', label: 'Pricing', count: faqs.filter(f => f.category === 'pricing').length },
    { id: 'security', label: 'Security', count: faqs.filter(f => f.category === 'security').length },
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
            <HelpCircle size={16} className="text-blue-600" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Got <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">questions?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to the most common questions about ReviewAI, from setup to advanced features
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.label} ({category.count})
            </motion.button>
          ))}
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <motion.button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={24} className="text-gray-500" />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-6">
                        <div className="border-t border-gray-200 pt-6">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Our team is here to help you get started with ReviewAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="#book-call"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('book-call')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Book a Demo Call
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;