// https://github.com/Microsoft/TypeScript/issues/4881 workaround
export default function wapper (cb: any) {
    return cb;
}