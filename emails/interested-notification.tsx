import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface InterestedNotificationEmailProps {
    listingName: string;
    buyerName: string;
    sellerName: string;
}

const baseUrl = "https://marketplace.ieee-ashoka.in";

export const InterestedNotificationEmail = ({
    listingName = 'Your Listing',
    buyerName = 'A User',
    sellerName = 'Seller',
}: InterestedNotificationEmailProps) => {
    const previewText = `${buyerName} is interested in ${listingName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="mx-auto my-auto bg-white px-2 font-sans">
                    <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={`${baseUrl}/images/marketplace-logo.png`}
                                width="64"
                                height="64"
                                alt="Ashoka Marketplace"
                                className="mx-auto my-0 rounded-lg"
                            />
                        </Section>
                        <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
                            <strong>{buyerName}</strong> is interested in your listing
                        </Heading>
                        <Text className="text-[14px] text-black leading-[24px]">
                            Hello {sellerName},
                        </Text>
                        <Text className="text-[14px] text-black leading-[24px]">
                            Great news! <strong>{buyerName}</strong> has shown interest in your listing <strong>{listingName}</strong> on Ashoka Marketplace.
                        </Text>
                        <Section className="my-[32px] rounded border border-[#4338ca] border-solid p-[16px]">
                            <Text className="text-[16px] text-[#4338ca] font-semibold leading-[24px] m-0">
                                📦 {listingName}
                            </Text>
                        </Section>
                        <Text className="text-[14px] text-black leading-[24px]">
                            <strong>Next Steps:</strong>
                        </Text>
                        <Text className="text-[14px] text-black leading-[24px] ml-[20px]">
                            • Check your Ashoka Marketplace dashboard for buyer contact details
                        </Text>
                        <Text className="text-[14px] text-black leading-[24px] ml-[20px]">
                            • Respond promptly to increase chances of a successful sale
                        </Text>
                        <Text className="text-[14px] text-black leading-[24px] ml-[20px]">
                            • Arrange a safe meeting location on campus
                        </Text>
                        <Section className="mt-[32px] mb-[32px] text-center">
                            <Button
                                className="rounded bg-[#4338ca] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                                href={`${baseUrl}/listings`}
                            >
                                View My Listings
                            </Button>
                        </Section>
                        <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            This notification was sent because someone expressed interest in your listing on <span className="text-black">Ashoka Marketplace</span>. If you have any questions or concerns, please contact us through the marketplace platform.
                        </Text>
                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center mt-[20px]">
                            Made with ❤️ by IEEE Projects
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

InterestedNotificationEmail.PreviewProps = {
    listingName: 'Calculus Textbook (11th Edition)',
    buyerName: 'Priya Sharma',
    sellerName: 'Rahul',
} as InterestedNotificationEmailProps;

export default InterestedNotificationEmail;
