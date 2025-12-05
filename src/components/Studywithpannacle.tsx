

const moments = [
    {
        id: 1,
        src: "https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/340081310_1218935875418221_3721515466045989943_n.png?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeH3oDcnhVKjKt7akZW9f7tTMIjsK5z85j4wiOwrnPzmPkiFVn-JHbSRmPiZyAAX3WyT0accjBE1CYmnQV_NS1RQ&_nc_ohc=eOEJILQsFaYQ7kNvwHUYgaV&_nc_oc=AdmCzxecq06eyltDHqj_DJVTbexnBI9Mi1jdZuF4BYaos2a52ckBsErYBUbaVEEGB3M&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=zhV3LiexdXNseDFZTSdOgw&oh=00_Afhyr4kycl5TuHF9xQGU7IkQ2ruVX9th229c9hWc8IKD6w&oe=6933B32E",
        alt: "Students laughing"
    },
    {
        id: 2,
        src: "https://scontent.fhan5-8.fna.fbcdn.net/v/t39.30808-6/338552245_1334542377327679_3046365282359019473_n.png?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeGl2QfxLPehF1saRSvXOK0E_Z8OURMOlpr9nw5REw6Wmma5RLT_xycimxZyuHxJhVoNnGcYmP2iE4mK8WECX6wA&_nc_ohc=nBDU2CjQ9pkQ7kNvwHJX7_M&_nc_oc=AdlpdYwtSf9rbge7NSGFJfAUSRxGohoXIQ1AK1af1IiNp0QpPmfNrF9HaJPYABZiOW4&_nc_zt=23&_nc_ht=scontent.fhan5-8.fna&_nc_gid=KNfpRF5wo0eM8q59T-J0NA&oh=00_AfibllzeyLtRC435iXYe_4u8IzbXfy_chxs4leELywGsWg&oe=6933CD86",
        alt: "Group study"
    },
    {
        id: 3,
        src: "https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/339982865_1139594310069574_6623375092764034867_n.png?_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeEuqKFydPYXWNQbWy3yKBf2uWhNC6K1DPG5aE0LorUM8XpbH4NclGHYTV9Ged8BFxBW1Jj4bfE1bPDbltxRFpnA&_nc_ohc=AwuI300U2lMQ7kNvwGOzTy3&_nc_oc=AdnhsL3c8WOx_DZGE6zBgho0qF9wiXz7ylB0iJxG65-hXcRfzEG4g6_ZnOxR96UUJg8&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=NlqMEPwLhGtwixFB4-aKQw&oh=00_Afh9ehWua5w0oTWgEjS08L0IxpZoFD3YmryvhTQvkjPuxg&oe=6933AC5A",
        alt: "Classroom discussion"
    },
    {
        id: 4,
        src: "https://scontent.fhan5-11.fna.fbcdn.net/v/t39.30808-6/338997469_1413102926186494_3512264217654918749_n.png?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFa1aKdRTNbRBwv2QbpDYJz9c_FOkRc4uL1z8U6RFzi4pNP2X4CTUzqDBI5GUN6da3Dl3aiZYCx9mrQBgbRxyQ0&_nc_ohc=BQn9IYUhCPkQ7kNvwFHO5g2&_nc_oc=Adk5mUb07mM3I5Blh9cJ3q6XpkO1xCpZIrlNS4O-xu70FT1nQ1ggii_7sCJw7Uawz2U&_nc_zt=23&_nc_ht=scontent.fhan5-11.fna&_nc_gid=t4Vm5KVatCR0ItJAauExjw&oh=00_Afh6YwHs03IO5_lFMZsIapfpmmV2XdyUQ8wp8peWHCpoWw&oe=6933B682",
        alt: "Workshop"
    },
    {
        id: 5,
        src: "https://scontent.fhan5-10.fna.fbcdn.net/v/t39.30808-6/338756000_736117507955521_6471796788224777661_n.png?_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeERqJnoYCIHR-HLcG9QvcpJVu76iT6L6BpW7vqJPovoGs_XzYRNSyMzn0f9a3718MfsEKP_sFv6-lo8NqWCh5vy&_nc_ohc=Fj4uF6SARBwQ7kNvwFnFt44&_nc_oc=AdlNUQ5XItd0r29IDfY4z3K4pBP4bQ6_unBW7jdvboFJM1V4NckgaYXoFoBsHuaiTEM&_nc_zt=23&_nc_ht=scontent.fhan5-10.fna&_nc_gid=IR8Dpu1BZ3k6ngoqubs9dg&oh=00_AfgLrQy7hFmNV5BzOyPeTJFBAi2pMC4jwnxhwBA5n-Qi9w&oe=6933BB8D",
        alt: "Student presentation"
    },
    {
        id: 6,
        src: "https://scontent.fhan5-8.fna.fbcdn.net/v/t39.30808-6/338556600_1349071472327270_6786173013979990738_n.png?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeEmkA2fr656PZlDLsovz_vdIafag3dswhwhp9qDd2zCHNypfkNkSSv4juP73Hik3nYxFiPiHXa7c4hLyaaI6T0u&_nc_ohc=uTQkrQILKb8Q7kNvwFwGIBf&_nc_oc=Adlf3ItbyeU53nOoT1FVc2K1BQQhmXbSp_bDxxrm0fuvhwy6mV97GVA0bSXG8-bQACw&_nc_zt=23&_nc_ht=scontent.fhan5-8.fna&_nc_gid=w_SxV9aOcFXPOSLLDwFNfg&oh=00_AfjnUzxVsR_wCrbHsTuN3dAp2J8dOXUrIr8Qh4RmVeKKEQ&oe=6933CA4E",
        alt: "Graduation"
    }
];

export function Studywithpannacle() {
    return (
        <section className="py-16 bg-white overflow-hidden">
            <div className="mb-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    HỌC CÙNG TMS
                </h2>
            </div>

            <div className="relative w-full group">
                {/* Marquee Container */}
                <div
                    className="flex gap-6 overflow-hidden select-none"
                    style={{
                        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                    }}
                >
                    {/* Inner Scrolling Content - Duplicated for seamless loop */}
                    <div className="flex gap-6 animate-scroll min-w-full shrink-0 group-hover:[animation-play-state:paused]">
                        {moments.map((moment) => (
                            <div
                                key={moment.id}
                                className="relative w-[300px] md:w-[450px] h-[300px] md:h-[450px] flex-shrink-0 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                            >
                                <img
                                    src={moment.src}
                                    alt={moment.alt}
                                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        ))}
                        {/* Title Card inserted in the flow */}
                        <div className="relative w-[300px] md:w-[450px] h-[300px] md:h-[450px] flex-shrink-0 rounded-2xl overflow-hidden shadow-lg bg-[#C8E6C9] flex items-center justify-center p-6 text-center">
                            <div>
                                <h3 className="text-3xl font-bold text-[#FFFFFF] uppercase leading-tight mb-2">
                                    HỌC CÙNG<br />TMS
                                </h3>

                            </div>
                        </div>
                    </div>

                    {/* Duplicate for loop */}
                    <div className="flex gap-6 animate-scroll min-w-full shrink-0 group-hover:[animation-play-state:paused]" aria-hidden="true">
                        {moments.map((moment) => (
                            <div
                                key={`${moment.id}-duplicate`}
                                className="relative w-[300px] md:w-[450px] h-[300px] md:h-[450px] flex-shrink-0 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                            >
                                <img
                                    src={moment.src}
                                    alt={moment.alt}
                                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        ))}
                        <div className="relative w-[300px] md:w-[450px] h-[300px] md:h-[450px] flex-shrink-0 rounded-2xl overflow-hidden shadow-lg bg-[#C8E6C9] flex items-center justify-center p-6 text-center">
                            <div>
                                <h3 className="text-3xl font-bold text-[#FFFFFF] uppercase leading-tight mb-2">
                                    HỌC CÙNG<br />TMS
                                </h3>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scroll {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(calc(-100% - 1.5rem)); /* 1.5rem is the gap */
                    }
                }
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
                .group:hover .animate-scroll {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
