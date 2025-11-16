import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import * as React from 'react';

interface InterestedNotificationEmailProps {
    listingName: string;
    buyerName: string;
    buyerEmail: string;
    sellerName: string;
}

export const InterestedNotificationEmail = ({
    listingName = 'Your Listing',
    buyerName = 'A User',
    // buyerEmail = 'buyer@ashoka.edu.in',
    sellerName = 'Seller',
}: InterestedNotificationEmailProps) => {
    const previewText = `${buyerName} is interested in ${listingName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-gray-50 font-sans">
                    <Container className="mx-auto py-8 px-4 max-w-xl">
                        {/* Main Card */}
                        <Section className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Header with gradient */}
                            <Section className="px-6 py-8 text-center">
                                <Heading className="text-black text-2xl font-bold m-0">
                                    🎉 Great News!
                                </Heading>
                                <Text className="text-blue-800 text-sm mt-2 m-0">
                                    Someone is interested in your listing
                                </Text>
                            </Section>

                            {/* Content */}
                            <Section className="px-6 py-6">
                                <Text className="text-gray-700 text-base leading-relaxed m-0 mb-4">
                                    Hi <span className="font-semibold">{sellerName}</span>,
                                </Text>

                                <Text className="text-gray-700 text-base leading-relaxed m-0 mb-4">
                                    <span className="font-semibold text-blue-600">{buyerName}</span> has expressed interest in your listing:
                                </Text>

                                {/* Listing Box */}
                                <Section className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg px-4 py-3 my-4">
                                    <Text className="text-gray-900 text-lg font-semibold m-0">
                                        📦 {listingName}
                                    </Text>
                                </Section>

                                {/* <Text className="text-gray-700 text-base leading-relaxed m-0 mb-4">
                                    You can reply directly to this email to get in touch with the buyer at{' '}
                                    <Link href={`mailto:${buyerEmail}`} className="text-blue-600 font-medium no-underline">
                                        {buyerEmail}
                                    </Link>
                                </Text> */}

                                {/* CTA Button */}
                                {/* <Section className="text-center my-6">
                                    <Link
                                        href={`mailto:${buyerEmail}`}
                                        className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg no-underline hover:bg-blue-700"
                                    >
                                        Contact Buyer
                                    </Link>
                                </Section> */}

                                <Hr className="border-gray-200 my-6" />

                                {/* Tips Section */}
                                <Section className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 my-4">
                                    <Text className="text-sm font-semibold text-yellow-800 m-0 mb-2">
                                        💡 Quick Tips:
                                    </Text>
                                    <Text className="text-sm text-yellow-700 m-0 mb-1">
                                        • Respond promptly to increase chances of sale
                                    </Text>
                                    <Text className="text-sm text-yellow-700 m-0 mb-1">
                                        • Arrange a safe meeting location on campus
                                    </Text>
                                    <Text className="text-sm text-yellow-700 m-0">
                                        • Be clear about product condition and price
                                    </Text>
                                </Section>
                            </Section>

                            {/* Footer */}
                            <Section className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                <Text className="text-gray-600 text-xs text-center m-0 mb-2">
                                    This email was sent because someone expressed interest in your listing on Ashoka Marketplace.
                                </Text>
                                <Text className="text-gray-500 text-xs text-center m-0">
                                    Made with ❤️ by IEEE Projects
                                </Text>
                            </Section>
                        </Section>

                        {/* Bottom Links */}
                        <Section className="text-center mt-6">
                            <Text className="text-gray-500 text-xs m-0">
                                <Link href="https://ashoka-marketplace.vercel.app" className="text-blue-600 no-underline">
                                    Visit Ashoka Marketplace
                                </Link>
                                {' • '}
                                <Link href="https://ashoka-marketplace.vercel.app/help" className="text-blue-600 no-underline">
                                    Help
                                </Link>
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default InterestedNotificationEmail;
