const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const THEME_IMAGES = {
    'play/write.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXugdC2xUROwupYc4JD5I_Abf-F4X6xxrSM7P4tD-3OyQ96Ca6h1UhfjClgTXBG9HSjqi2aOVqjffoOAln4qr9b-CAx7Dd7oORLyBfWipvXITK1o0FjYryDeXs5d2l6bN3xOJKgt2vDAIJv2Hr8Q4JNyqKg9thfPh1oH7jHLtmURS_RB8ITCfxtxmNvWf3heqWFrFh5BpvnZ2aKVQ2ibTnzXHzBrEMtSFU7ApUn7rtAFgKElPLVsZc9T4k',
    'play/brainstorm.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXjZgT4OFmVgYqp1roKqskc0KkZOnIpfxFKFuciPiopCIODl-9WTl3rkooEeqAJqNFsPG8hpS-gh_YgWQSYZ74AAi4Vx5fSajraswkDpHPgNpTYRmrII0CA9zA9fDB_J9YFrLuiVEiYy4QcpzoY7ozM-50SkegErTxb5ea7nv7jsOxSNkoR3I0WYbkH1yI_mMeyEyjBQ3MMiZ-MzFKkoRqKvxZ_bucN0FTd-TkU7Akn16j6bsjNGaiySg',
    'play/data.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXpCdsde-oXSWA3Khf6JdQBUTPP9_-38bqF0JUiBmSwAHdW85f4OYT6CNwN9NcMf2cHUkm6RmQ_iKraytOojWPZsEvQe8AifvUkixEcMNvjm1UZ_neXDlTLZb9-KJWrRxy_tQhUrCx6WSaYJv_K-KjMKa4j2Fz-tWsKkoWLtdk_XmfqgvIim1lBpbWXfIekCDL0HFcF0bNHeJXpkDnnw0s8NP4MtVC0JRMagAGiezSzksAyh5_CF9wexg',
    'play/audiobook.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVK2YyccpZetRiyMOVTVfwtbebFqxqm5d4oNcO_z_9BJ7UK2pUK47dezASLu4eHUlXnCU3PiMtVg5bDRamxZoOjKx5Kfe_zGLyiEFzIJUvrtORloZBrg7d6a7AX0T79iRD63xMILFj-LR0AMgHuiOeMGjytYyBmUXPsK1PNzUSGaRXiS21uK1VnrBiajJ7ZMVz2Huqx6ch3KkDchOF0I49tOeAgE_u7bjT2-AUbvRLmFKPIXp3XPRTTUtU',
    'play/publish.webp': 'https://lh3.googleusercontent.com/aida/AOfcidUuH4OTIxnNpO2BlTLshvCXSDeFxGe0SZVURErDwG9lt7UPqOXw4Jjs_w1PWST_Zr6fw3moAH5Esf83PoTMtfhNsbi53gOaAcAKeDfy9nU0jjyNEZOKq2kY8pgFs_iiMPfiXvbZtvhbyHFRqmP6wXmAT_Rq_NhPQNfICDm8a-_YBL8ON15h44mfQrwhLZibLFWOo8Z_BI9yuNZMWGg-Ia5DB4q7wuV7AggklwH5vNkrHAOzRnNd-Cks5A',
    'play/settings.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVBrcmTGln4XQ8gnpU4yQO6dskbrlq_F1sk-uFGb53spA7m2znhQqAEGTRfLM6dh01NLPTDsoelGlxq6rTz-lGR9aOG3B4g2rgOHBJwM6i2--D8ICakvHWVOK_nULVNa6isM5vGOqm0jH45zCe2FXYyYy0N1FfJpWSwVkPiuJkyzGcNlaqnKsQe8YEwvW0RiCb-ZLIVdolerQbg8G1R-AI4Fk2hbj-Hx-JRPpDEvst-hWljliYNsl91g_s',
    'global/write.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVwNT0xAJjapOkrErgJmKdyUCYtVedAwOGuJwS1FNYje0F_GXh-k4DNDIlwaefnfpIniWP_paX1sIn162t0Y9V3xkPsEwbnaSqGgaz946TbSxoUckN77jR-sehtysLTx9XzyMf-Nvk-QU0o2DSacNOSZ3DmL5CWfURWQ93QMAnYZW-9W1RiOLtm2Oc_h8w2hefWs_u9rTr8xtBMiOVceFQJsCDX2cI2E1S7MebMpG09wYyfgS7mczEdTQ',
    'global/brainstorm.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVo3yYePeGMJbkXaB8gZIr7T-DA7CGDtsnGYRzEXCg-xhjERxlpqCsGK0pfd2sJYVOtQ8cpSF4dTVnMFfCaK30UJ39VvcHDNuEZtbLq4Zq-L0qavqORnlq9EybMLeaDAf-faWl_6MQABT6KwTS4Wh7MaBslI1s7a8os_Be0-T6g9BdhvblVaqsMFB5fHp1l0xh2yHI1lUYs2WgyG0G_YUAoYU8Xrdm9xPs6FySY0dff7JoHaA3fqSSky9A',
    'global/data.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXJXhB1EQILvfVfC3T3fLySpqh3PoLFBU89cYGLQLDJkLPdhkCpB0AbIOpRYcDjwsbkrzHw2oAqaKEjiVf8IS80bh1uOjO3a5ak_EjdteD2xLY4OzMhSsiF6ffYT6JqKmU3QRNQcgKTICVZftXVTfJTxXI7s6pbwvlHX2k30v2breYY1kQaaGBxfhzct2nA6A1ujINSxckgIhrCOuVwRYGOi2YzeFfirgBqpp3Vmo7kFjFUyUYsFkHiP48',
    'global/audiobook.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVcwUB2qUM9XywAYMFv_Nuki5Flm99Q0QmUSNa7FVjNNNHPd7BGOJi_YvNMLNls3NXkHvQkvyHydCjeJg5-bn5iil5viqjErfdSzX00KOp6TGr5ebDmyOysT2FIknnomhhsjlfvmdzklEKBBjJa3cWCpGgil510tj9yAgk-LuUBCXr1f8sWjCMdnKUcSOC2RKYuWvGSFm3i2YGxF-LqQNJ-qLnGLuPOHi8CtvbSw72ICpXY9IbkUZwp3hI',
    'global/publish.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVSt3ZlqijCOqa0ogLHgrQ5L2eMzVw2RVYfj3tR8J7frqg075Fol_cevdnGzQM7ItoEE4cZbGG0KSnyIS2bGDtgnoAULTxzPi_wXmYrdifmiYp7vmyCcY2FMh2Vxr_OxaYzv32Z1bTr7Q-xiZcErvsLrdTjGLGp6I84oXW6EK7YG41LEaR_asEUwzuPFRa_iWLfmOV4r_WsqYcf8HLj5-Cr3daUdMB22qOdIl46eSLUq_ATrvp4_OhTHcg',
    'global/settings.webp': 'https://lh3.googleusercontent.com/aida/AOfcidWkm1qOK4LKMIpC7wf1xSEVgZ2WFN9WM1rckruHhJjSR-FKK87lLA76hV-c5lTEEFbXAFJdCm7WBaydtAsyxc3NdZpR0knzYRfduloshIdViyAnIlA-UZhpLeF9-2GHdrap3n3QAKFgiH591tOk_rDRftoGVk8tF1xzNbLLiHze-u3sICwXpAoyzE3zg6jO-bfiuy2UTk0-fxXcN_PUMdJPW5MjbNdGCl54SCOcsWuXQdnWNB6NGZ4Fc4M',
    'futuro/write.webp': 'https://lh3.googleusercontent.com/aida/AOfcidWNtfPvSbdnzN63EFnVeax_RgkCr51KlZza3e1JwtHNX_FjncmMFAfwAtDcj2AK1uxz3Z-C1h655FWtswo_U0qtC1ztotHdUKEO24mXdkSJjNgbfADMq9PmaqXWUOnLBw9MDjYm7UAwGNKFRuCoBJxn5xyUxAK67GQ6GcS1XWmC8IkyMJ8_AyuhM0MDquh3rLvhd5A9Sn6PSOHJcHmPJh0qjB8GOnQqMR9IEmTp74PRKWm5UVJ7Kh2dWbM',
    'futuro/brainstorm.webp': 'https://lh3.googleusercontent.com/aida/AOfcidUn-U_YN2OFxPzs0myOJVNo4-ByKkSzWW7I4IX0RgKNGos4x2LvQ5UqjbCEag2jJuFxzwvDZ8rLW9a1ifaL-XefDAW_YJg7GjWX-gT51mesvftDwScxxAkgiHCTBrKsW65qL1XVbxcnip2vJ3MmUiUoKslpvSO5D2lmNZrkQa-mtwYreFZmJjPlNn3S3G5Ec636hNxSj0f-TRzeAFY6KPEGJDCPioPhx-jdLvDCfds0mVzUAAWxoimQbdM',
    'futuro/data.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVIUiedJfXP8GvPppK6U2TIweOTJZ3tCehCifATJHZUGRRbcTOfmDNz-dWxRIEzA48OV4O__y_iNVcPI92G0NLXEU8G9Vj3jIJ60JiF2iMqJhr9QqQrzk9jdPXfZ2-Fud2rjeR952s8GYBWz8Bay21E9cHfH04GpRuQj3hQbgq9zb7D1uHfOi-gujXnQ4VTKso4_JrP4jOGfYMz3UqmXZ7vzitmw07gBbYovjyvUOIxsIHL-2o5tROnKmk',
    'futuro/audiobook.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXH1vLtmpJ1FHJrcdhxe84OP8xSn6iKpipUifIWbAPF26ZLSKvmeghOVBo1bgfjllqjP4KqYfgmvtKKIzo1bJGX79uk7U_YPoL11DstaihAxNwFw1gMOZcLA7LcMD8SoS7qSdOIyflb5i0BLNH4NcbvY9YpiqJVR8NTnwL9REf16O3PZzeosOib68F9kZ_H_rcrYPChpvhzg4sRBlN98OH3Tv-v4hMTkn1zxpzV1mFEiri7jgY1SpGS0p0',
    'futuro/publish.webp': 'https://lh3.googleusercontent.com/aida/AOfcidUY24s1NxtoUsNZ8N4UlFnT1SbeVjuhfZi4TPKiuBT6KYPmhOBM1HmuXWgjtxiTK0IfMhnH_4vfSZk4VVo3hgdN8OxIl0RZXWWqd8Dwztj-XNyzGvSRPCG-W0SheDjwx1X89n71HTb-PGBEo9HYKialU9TgtiX_rDbxvy0ZZKp_t7iN2fKtdInpFIGyJn99mYMeNzNq87lRy_cIKJZs6LT9zBhWvQgDLZCW_cQR24pGoMf7tVvAfyPZhtI',
    'futuro/settings.webp': 'https://lh3.googleusercontent.com/aida/AOfcidUYxxh32yoa1rFY5tjEHRDy5wur1wFMQu7pYEerM2X9uhIAlxBHRNrNmbwMwGHjUG4mZWd7u5mTuL1436PJPszfNQKgEd68VIOPNVaD30TwGP-WcyYV1K_S4vqiWsPslWSWwyf6h5qz88Q54rsjhnl9zjF8AQdNuWJMdDG76vBcWGpocyv_hhj5_6QdbZ_ksIBgD355sOt_vP4f2yjd_Si7vWOJq3g9BTLd59ecyCLQRzEZXTiHg1pQG7o'
};

const AVATAR_IMAGES = {
    'play/architect.webp': 'https://lh3.googleusercontent.com/aida/AOfcidWAVzKUU5CsQn-qck1UJpEMwcVQtUXVyp0b8SFmtgfOF904boltPB5azvVPbjztvA5AEEO13bw_dvfZJMK6xAktcRNn1YzP4pqx_OrGO-062Kt_2-IyBYIdTyGbfZbaCqLz2uSWhQPMLPoZ_d0Dy-yACLn97MarPbtKGtwbBoOqmZnYSJ-oMd3MffOmaSn-NDi5aa9uHnTdN3rigbozO1a4JdaMxQtcMUDTWyL7Uy-JD2ETFiUfZlO2f-I',
    'play/stylist.webp': 'https://lh3.googleusercontent.com/aida/AOfcidV2NcHsYysTpFYlDLHgpEP-idkIxmA4GefHc1xJ4fK4VnrnTHm3VsYnSZklW2OZKz-u52esoYmT8Z-_oPKT0UfIq6RsRAaMMVWifZkv3OI0sAylqY3JjQnADM7BIO0YZ3t89OTJWJra5tEaTc_SS2ZZwVzWV17L2xQNG7-DFIkFBz4Sw44KPGh9GOQjo0ODZHpXn0ML6j6PS4TDYOjhnPpR3XLM8r6EyAShn81WA7hW__ue1nwM75pa0GE',
    'play/editor.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVrdHeTxJQZWglrUXrV7Of2hh1pjxqdET3qRKmESzZ0R6bjC7Zbg9vU4zCC9_CELmLn2gdOPZuIc6W_jVC7o4O08CvtlU9sMpDYAVYPUr0nHhJOVVyLJiEgWYOWWajx1oLT1KV2GhQctWBWCKsVuOOdZOK-ZfNd3FAKo4F-mPjXZjJsxPVQxkQeOrTLKaL6_Jh5BDCWAsllqtsYzFGkfXk6Ap-7HwX8XOLSjx2-VkakQKm3gfSIXVhdJRM',
    'play/narrator.webp': 'https://lh3.googleusercontent.com/aida/AOfcidX3IcJRh3wnAO6lzJgYhqrJAT9ZiYiaM1R8_6rTnC_mwith6XSPGDQWhGhGDO8qGAqL71ov90S9vYZf86sIDE-FH0jCdRzLVCrS-m_PsFfLxWyCC6QJMvY6gpE6EriTlo79xvvSZRhbsJLohjjQ_AmSYuyeAGKMssihSWYxPOxcdMk6EYrPlddu8ueFxNhXDmv1zRIxKXhtgsLpF_90JgPaD1MmqxnW__Nd_IIghjXB7hqCgyIcB1Er5mA',
    'play/strategist.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXxA71xkYvQT6NKD8W0saOEbotPJYC25FYPxj5J_lskW173nChCsIKBpbaS86HrAOmL5iZ-8KyLgRKVXPkc-tJa_XSfgVHxNbCpsvlIgLK7CGsBNvwgtyiZ-FN9QJCYfZsusx2CYOyyQFyEUMBEvriSDyU6ZBmZTHhxf_4TiyV_rTB6psN5Ziw6SWutPZ1PtxY-CcUewFS_G4naz9bDgaa4-RGedJiLLEO0UOXDCa-0LvYxV5W-LyK80b8',
    'global/architect.webp': 'https://lh3.googleusercontent.com/aida/AOfcidWFgVFFIQwccqzqHlw9Y0Iz74nFrIHy4mWB2tWHuqtKlmf_Y30tCs-D315jmJs3gdq1JJMcjkwB6V9EmdoQrJT-VG_xiFRpqx3WwvKC8p_ZX3oGsurq72sWgW-iG6Igp_3GaCbC3yDT6_JoKdZGXOQxzALuc8GWf5Zoh_1rLWcNZ_Ws7zhyxpTTx_jxlKdjBCTBtisv5hS1_oVAgpoOrOIP-zCH7Yc-Vj7Lga5n-XpxyDwacPv9KMiMRtQ',
    'global/stylist.webp': 'https://lh3.googleusercontent.com/aida/AOfcidUcjKDPCopAWWTqP0E8qv7ccxWKt7GRowfaOis4xqDX6CumCoyhdNSqjl-wWj4wSrvz_tSfviZEEsV7UV5YHEEVmhtycewITvTWRmI3Y2g7pf1TYcwEN5Q8nqX43TjE7G9W55Uta0kztbHFQbzhNIcA3v-HJtSiliY3ZWiMWOYStPinDht2oH_5VSuVhGdd9hGRaDd2Fi3NibBTXxjanAF9tqAoKtQzNjsRGU5cnlORUPsNM95X6HDMZOA',
    'global/editor.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXjOHlfJ1gmRC1TSRwfPv4IQ9BeOTp0NuUEm5spHVV5J6r3k3pGLjIgQtmYyTcrPqQGHOB6vNKdZ69zQ59fPA4048DpFDTio7TBVuThVqGe-T-XMPah49jwLoVtHvdZNNI5awZCP4MSwP-QbbUIy0aO5Pg52lCrNp8-muaLqKwONrU9zgKeIn6Uw8ATqQZ7-GKDsrSbdowJmyIAlsRp0xK35l3Adk6MKOby4yiPNNFmdHyhIOSDs6EnC8g',
    'global/narrator.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVbc8yG_bc1jpU6-tOkG8Lx5d4mirgFPPke_T0e1TSCLmoAj6mG1W-tEwaMiSQjJEJhAfrLdDHoFyZspmjk3Jy2cedZ5WnHJ54XcyJfOWGpEX302acLmw980fo3-1O0pjboOpmJk-I0e-AdZxgGHj-ZTWSQcj5-OKTNDucxbms4OJqQrOHeoumsueH-Y2lcUh-kttEkk3uRXTOFiSJ2IHu3zM4FVG22FV1hDRE62EuDOOgw_tYheQc-L50',
    'global/strategist.webp': 'https://lh3.googleusercontent.com/aida/AOfcidU3YOHH-xRMACzviNvqj3eS9HuSJQ8917xQLwe5eTq-JkCIh58tenMfvBDfVmid5JP5_SyV5uFmw5vQ8T25VyP0BEArY7VU1-22hsUXNVvVGBvCvbkEwbcCNVXblO0dxDIbrPXMISRokDjUDYIiIkpLYWA75YP20qE4apXoRcyiAAHUEGwlVF5lqpfGzVmSIr6hqqSkgd6oBLpi1l4RUewMZGA_k8kS5WB0NdFCd6bX3YugPxz8dsqv0QQ',
    'futuro/architect.webp': 'https://lh3.googleusercontent.com/aida/AOfcidXwTJhGf8bGvfrcrytGmqt_C5g4Fn6lW743Tr3Zc-DxImm9wdCJpNIuzIIHCiPGWGY5Djg5b2-adnHdQc2i3IwnjiSk0ZEWEfif9SYwWpwHwYiXoPWgazQdZO7ujGesJTWLSIfQ4gfoWkEbD3PttqKyeQIcdeu_hGoRqEPIxSeZzj0rnPNm1W_GDD99FdKN7bAgpCssOMZlnbbgb0ZQswcJRmL8fE8N1nzLkDnF12ivcwiVCwwMaZltPx0',
    'futuro/stylist.webp': 'https://lh3.googleusercontent.com/aida/AOfcidUnr7DtWzuVS0_-nfY286uHm73RhwLnGXqnA7BXGeNGYg2yM8HkGNMb5ccRiOsO58YDVniGWxUaV1UcABqqhZ6LsXnbrhEiLd8e-NAjesrhO88cKPpZ-ovLjIg4BaXrEuhU1CNKCLywBksIW3PbyfqWt3x8FwSCK43_hhi_-X_qfsX0RazC1FI69D2zPsW3vAApdmBaLkgGsIjmlWu-P3FBGv1JTPYkbkBURIQndc_pU6AjCpJJ3H42Ucg',
    'futuro/editor.webp': 'https://lh3.googleusercontent.com/aida/AOfcidWln9696LoVoleZBzLqqp2AAaa-uydCP4qsR4KtvqdarWA8q1dLBU2JVyRFob8GySVWHW5M0WwNJwh29MqBiaMkKi7ZKtBIqYihEZ7YMO8cAm0KZ57KSPLbhizBkr2a0xgtDt4sYoai2gpEUqsGt7mvRYTB2IitF7yUZN-GdCgohI4VofgPJivk7xxPM4mfPft8UiA9Tb_fusGW35xLGWSz9UAZc3mDKKu4dhl9fEV5dnY7tCh2BDZKscc',
    'futuro/narrator.webp': 'https://lh3.googleusercontent.com/aida/AOfcidVRRPgVDgEiyiKE5r4BgBvRlPdqOq2_95gH6IZgLRxKDodzaxt8fV1ctbStXJty6OLAu-kws0ngXuwoSyjJ9OsEZEq_8GPnueBUqEXO3OURTNidFy_BwOQZRrN80g2s_YeNl0BR0uxUg6M26nFBqfqP16dnRBNlbJAwEBgNbvo7JGrsB2PQaf88MlG2AU-GTdGuQY4Z9d16PKtrxSdfRFakpM2wdijaD0swQMcMtaNVxhgkizXX4RnZ4A',
    'futuro/strategist.webp': 'https://lh3.googleusercontent.com/aida/AOfcidUNOBYsoz0aszvN6G0atiMkbWhdDX1LS4rUQgboAh-CVly3Q3r640BcAQlBrXFL_-e2kVMVSXLjcvG4wvgs71i0m1shfg5ZR7gIl0TYxeN4G2FnF1PMwB7T-aiBTzvb8558LwnfrCov7tNuOkolmxv1GuwBOJhmTt8d3y73E-fss29HOMjid-3kTIZC-rpD62YvWgCkKLkFbJcXFvUH8u_yJXlehrlLE-ITMAdWjhBPQjawpP0RbQKz2Ts'
};

async function downloadFile(url, targetPath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    
    // Ensure dir exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const fileStream = fs.createWriteStream(targetPath, { flags: 'wx' });
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function run() {
    const promises = [];
    
    for (const [key, url] of Object.entries(THEME_IMAGES)) {
        const target = path.join(__dirname, '../public/images/themes', key);
        if (!fs.existsSync(target)) {
            promises.push(downloadFile(url, target).then(() => console.log('Downloaded', key)));
        } else {
            console.log('Exists', key);
        }
    }
    
    for (const [key, url] of Object.entries(AVATAR_IMAGES)) {
        const target = path.join(__dirname, '../public/images/avatars', key);
        if (!fs.existsSync(target)) {
            promises.push(downloadFile(url, target).then(() => console.log('Downloaded', key)));
        } else {
            console.log('Exists', key);
        }
    }
    
    await Promise.all(promises);
    console.log('All downloads complete');
}

run().catch(console.error);
