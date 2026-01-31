type Props = {};

const Features = (props: Props) => {
        return (
                <section className="section-card" data-testid="features-section">
                        <h2 className="heading-primary" data-testid="features-heading">
                                Features
                        </h2>

                        <div className="space-y-4" data-testid="features-content">
                                <p className="text-content" data-testid="features-intro">
                                        Some of the features of the extension till now are:
                                </p>
                                <ul className="space-y-3 ml-4" data-testid="features-list">
                                        <li className="flex items-start text-content" data-testid="feature-site">
                                                <span className="text-primary mr-2 text-xl">•</span>
                                                <span>
                                                        <span className="text-primary font-semibold">Site Supported:</span>{' '}
                                                        <span className="text-white">archiveofourown.org</span>
                                                </span>
                                        </li>
                                        <li className="flex items-start text-content" data-testid="feature-download">
                                                <span className="text-primary mr-2 text-xl">•</span>
                                                <span>
                                                        <span className="text-primary font-semibold">Download:</span>{' '}
                                                        <span className="text-white">Download the story in epub/pdf format.</span>
                                                </span>
                                        </li>
                                        <li className="flex items-start text-content" data-testid="feature-story-type">
                                                <span className="text-primary mr-2 text-xl">•</span>
                                                <span>
                                                        <span className="text-primary font-semibold">Story type:</span>{' '}
                                                        <span className="text-white">Single chapter, full story, whole series.</span>
                                                </span>
                                        </li>
                                </ul>
                        </div>
                </section>
        );
};

export default Features;
