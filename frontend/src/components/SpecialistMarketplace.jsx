import React, { useState, useEffect } from 'react';

import './SpecialistMarketplace.css';

/**
 * Specialist Marketplace Component
 * Browse and hire Web3 specialists by category
 */
const SpecialistMarketplace = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [specialists, setSpecialists] = useState([]);
    const [categoryStats, setCategoryStats] = useState({});
    const [filterLevel, setFilterLevel] = useState('all');
    const [sortBy, setSortBy] = useState('rating');

    const categories = [
        {
            id: 0,
            name: 'Smart Contract Developer',
            icon: '⚡',
            description: 'Solidity, Rust, Move blockchain developers',
            avgRate: 150,
            demand: 95,
            color: '#667eea'
        },
        {
            id: 1,
            name: 'ZK Proof Engineer',
            icon: '🔐',
            description: 'Zero-knowledge proof specialists',
            avgRate: 200,
            demand: 98,
            color: '#764ba2'
        },
        {
            id: 2,
            name: 'DeFi Analyst',
            icon: '📊',
            description: 'DeFi protocol analysts and researchers',
            avgRate: 120,
            demand: 85,
            color: '#f093fb'
        },
        {
            id: 3,
            name: 'NFT Artist',
            icon: '🎨',
            description: 'Digital artists and NFT creators',
            avgRate: 100,
            demand: 75,
            color: '#4facfe'
        },
        {
            id: 4,
            name: 'On-Chain Game Builder',
            icon: '🎮',
            description: 'Blockchain game developers',
            avgRate: 130,
            demand: 80,
            color: '#43e97b'
        },
        {
            id: 5,
            name: 'Protocol Auditor',
            icon: '🛡️',
            description: 'Security auditors',
            avgRate: 180,
            demand: 92,
            color: '#fa709a'
        },
        {
            id: 6,
            name: 'Tokenomics Designer',
            icon: '💰',
            description: 'Token economics experts',
            avgRate: 140,
            demand: 78,
            color: '#fee140'
        },
        {
            id: 7,
            name: 'DAO Architect',
            icon: '🏛️',
            description: 'Governance system designers',
            avgRate: 160,
            demand: 82,
            color: '#30cfd0'
        },
        {
            id: 8,
            name: 'MEV Researcher',
            icon: '🔍',
            description: 'MEV and arbitrage specialists',
            avgRate: 190,
            demand: 88,
            color: '#a8edea'
        },
        {
            id: 9,
            name: 'Layer 2 Engineer',
            icon: '⚙️',
            description: 'L2 scaling solutions',
            avgRate: 170,
            demand: 90,
            color: '#fed6e3'
        }
    ];

    const proficiencyLevels = [
        { id: 0, name: 'Beginner', badge: '🌱', color: '#10b981' },
        { id: 1, name: 'Intermediate', badge: '⭐', color: '#3b82f6' },
        { id: 2, name: 'Advanced', badge: '💎', color: '#8b5cf6' },
        { id: 3, name: 'Expert', badge: '👑', color: '#f59e0b' },
        { id: 4, name: 'Master', badge: '🏆', color: '#ef4444' }
    ];

    useEffect(() => {
        if (selectedCategory !== null) {
            fetchSpecialists();
            fetchCategoryStats();
        }
    }, [selectedCategory]);

    const fetchSpecialists = async () => {
        // In production, fetch from smart contract or subgraph
        // Mock data for demonstration
        const mockSpecialists = [
            {
                address: '0x1234...5678',
                name: 'Alice Chen',
                proficiency: 3,
                verifiedProjects: 47,
                totalEarnings: 125000,
                averageRating: 98,
                hourlyRate: 180,
                avatar: '👩‍💻',
                specialties: ['Solidity', 'Hardhat', 'Security'],
                endorsements: 23,
                responseTime: '< 2 hours',
                availability: 'Available',
                portfolio: 'ipfs://...'
            },
            {
                address: '0x8765...4321',
                name: 'Bob Martinez',
                proficiency: 4,
                verifiedProjects: 89,
                totalEarnings: 340000,
                averageRating: 99,
                hourlyRate: 220,
                avatar: '👨‍💼',
                specialties: ['Rust', 'Solana', 'Move'],
                endorsements: 45,
                responseTime: '< 1 hour',
                availability: 'Available',
                portfolio: 'ipfs://...'
            },
            {
                address: '0xabcd...efgh',
                name: 'Carol Singh',
                proficiency: 2,
                verifiedProjects: 18,
                totalEarnings: 45000,
                averageRating: 95,
                hourlyRate: 120,
                avatar: '👩‍🎨',
                specialties: ['Vyper', 'Testing', 'Documentation'],
                endorsements: 12,
                responseTime: '< 4 hours',
                availability: 'Busy',
                portfolio: 'ipfs://...'
            }
        ];

        setSpecialists(mockSpecialists);
    };

    const fetchCategoryStats = async () => {
        // Mock stats
        setCategoryStats({
            activeSpecialists: 234,
            totalJobs: 1567,
            avgCompletionTime: '12 days',
            successRate: 96
        });
    };

    const handleHireSpecialist = (specialist) => {
        // Navigate to job creation with pre-filled specialist
        console.log('Hiring:', specialist);
    };

    const handleEndorse = async (specialist) => {
        // Call smart contract to endorse
        console.log('Endorsing:', specialist);
    };

    const filteredAndSortedSpecialists = specialists
        .filter(s => filterLevel === 'all' || s.proficiency === parseInt(filterLevel))
        .sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.averageRating - a.averageRating;
                case 'projects':
                    return b.verifiedProjects - a.verifiedProjects;
                case 'earnings':
                    return b.totalEarnings - a.totalEarnings;
                case 'rate':
                    return a.hourlyRate - b.hourlyRate;
                default:
                    return 0;
            }
        });

    return (
        <div className="specialist-marketplace">
            <div className="marketplace-header">
                <h1>🎯 Web3 Specialist Marketplace</h1>
                <p>Hire elite talent in high-demand Web3 verticals</p>
            </div>

            {/* Category Selection */}
            {selectedCategory === null ? (
                <div className="category-grid">
                    {categories.map(category => (
                        <div
                            key={category.id}
                            className="category-card"
                            style={{ borderColor: category.color }}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            <div className="category-icon" style={{ background: category.color }}>
                                {category.icon}
                            </div>
                            <h3>{category.name}</h3>
                            <p>{category.description}</p>

                            <div className="category-stats">
                                <div className="stat">
                                    <span className="stat-label">Avg Rate:</span>
                                    <span className="stat-value">${category.avgRate}/hr</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Demand:</span>
                                    <div className="demand-bar">
                                        <div
                                            className="demand-fill"
                                            style={{
                                                width: `${category.demand}%`,
                                                background: category.color
                                            }}
                                        />
                                    </div>
                                    <span className="stat-value">{category.demand}%</span>
                                </div>
                            </div>

                            <button className="view-specialists-btn" style={{ background: category.color }}>
                                View Specialists →
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="specialists-view">
                    {/* Back Button */}
                    <button className="back-btn" onClick={() => setSelectedCategory(null)}>
                        ← Back to Categories
                    </button>

                    {/* Category Header */}
                    <div className="selected-category-header">
                        <div className="category-info">
                            <span className="category-icon-large" style={{ background: categories[selectedCategory].color }}>
                                {categories[selectedCategory].icon}
                            </span>
                            <div>
                                <h2>{categories[selectedCategory].name}</h2>
                                <p>{categories[selectedCategory].description}</p>
                            </div>
                        </div>

                        <div className="category-stats-grid">
                            <div className="stat-box">
                                <span className="stat-number">{categoryStats.activeSpecialists}</span>
                                <span className="stat-label">Active Specialists</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-number">{categoryStats.totalJobs}</span>
                                <span className="stat-label">Jobs Completed</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-number">{categoryStats.avgCompletionTime}</span>
                                <span className="stat-label">Avg Completion</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-number">{categoryStats.successRate}%</span>
                                <span className="stat-label">Success Rate</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters">
                        <div className="filter-group">
                            <label htmlFor="market-proficiency">Proficiency Level:</label>
                            <select id="market-proficiency" name="proficiency" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                                <option value="all">All Levels</option>
                                {proficiencyLevels.map(level => (
                                    <option key={level.id} value={level.id}>
                                        {level.badge} {level.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="market-sort">Sort By:</label>
                            <select id="market-sort" name="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="rating">Highest Rating</option>
                                <option value="projects">Most Projects</option>
                                <option value="earnings">Top Earners</option>
                                <option value="rate">Lowest Rate</option>
                            </select>
                        </div>
                    </div>

                    {/* Specialists List */}
                    <div className="specialists-list">
                        {filteredAndSortedSpecialists.map((specialist, index) => (
                            <div key={index} className="specialist-card">
                                <div className="specialist-header">
                                    <div className="specialist-avatar">{specialist.avatar}</div>
                                    <div className="specialist-info">
                                        <h3>{specialist.name}</h3>
                                        <p className="specialist-address">{specialist.address}</p>
                                        <div className="proficiency-badge" style={{ background: proficiencyLevels[specialist.proficiency].color }}>
                                            {proficiencyLevels[specialist.proficiency].badge} {proficiencyLevels[specialist.proficiency].name}
                                        </div>
                                    </div>
                                    <div className="specialist-rate">
                                        <span className="rate-amount">${specialist.hourlyRate}</span>
                                        <span className="rate-label">/hour</span>
                                    </div>
                                </div>

                                <div className="specialist-stats">
                                    <div className="stat-item">
                                        <span className="stat-icon">⭐</span>
                                        <span className="stat-text">{specialist.averageRating}% Rating</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-icon">✅</span>
                                        <span className="stat-text">{specialist.verifiedProjects} Projects</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-icon">💰</span>
                                        <span className="stat-text">${(specialist.totalEarnings / 1000).toFixed(0)}k Earned</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-icon">👥</span>
                                        <span className="stat-text">{specialist.endorsements} Endorsements</span>
                                    </div>
                                </div>

                                <div className="specialist-specialties">
                                    {specialist.specialties.map((specialty, i) => (
                                        <span key={i} className="specialty-tag">{specialty}</span>
                                    ))}
                                </div>

                                <div className="specialist-availability">
                                    <span className={`availability-badge ${specialist.availability.toLowerCase()}`}>
                                        {specialist.availability === 'Available' ? '🟢' : '🟡'} {specialist.availability}
                                    </span>
                                    <span className="response-time">
                                        ⚡ Responds {specialist.responseTime}
                                    </span>
                                </div>

                                <div className="specialist-actions">
                                    <button
                                        className="hire-btn"
                                        onClick={() => handleHireSpecialist(specialist)}
                                    >
                                        💼 Hire Now
                                    </button>
                                    <button
                                        className="endorse-btn"
                                        onClick={() => handleEndorse(specialist)}
                                    >
                                        👍 Endorse
                                    </button>
                                    <button className="portfolio-btn">
                                        📁 Portfolio
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Become a Specialist CTA */}
            <div className="specialist-cta">
                <h2>Are you a Web3 specialist?</h2>
                <p>Join our elite network and get matched with high-value projects</p>
                <button className="register-specialist-btn">
                    🚀 Register as Specialist
                </button>
            </div>
        </div>
    );
};

export default SpecialistMarketplace;
