import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Constants for the Angular and Next.js apps on Vercel
const angularAppUrl = "https://your-angular-app.vercel.app";
const nextJsAppUrl = "https://angular-nextjs-poc.vercel.app";
const domainName = "poc-aws.mesquita.dev";

// Create an S3 bucket to host the proxy
const bucket = new aws.s3.Bucket("proxy-bucket", {
    website: {
        indexDocument: "index.html",
    },
});

// Upload a simple index.html file to the bucket
const indexContent = `<html>
<head><title>Proxy Project</title></head>
<body><h1>Proxy Project</h1><p>This project serves as a proxy to route requests to Angular and Next.js apps.</p></body>
</html>`;

const indexObject = new aws.s3.BucketObject("index", {
    bucket: bucket,
    content: indexContent,
    key: "index.html",
    contentType: "text/html",
});

// Create a CloudFront distribution
const distribution = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    origins: [
        {
            originId: "s3-origin",
            domainName: bucket.websiteEndpoint,
            customOriginConfig: {
                originProtocolPolicy: "http-only",
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ["TLSv1.2"],
            },
        },
        {
            originId: "angular-app",
            domainName: angularAppUrl.replace("https://", ""),
            customOriginConfig: {
                originProtocolPolicy: "https-only",
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ["TLSv1.2"],
            },
        },
        {
            originId: "nextjs-app",
            domainName: nextJsAppUrl.replace("https://", ""),
            customOriginConfig: {
                originProtocolPolicy: "https-only",
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ["TLSv1.2"],
            },
        },
    ],
    defaultCacheBehavior: {
        targetOriginId: "angular-app",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
            queryString: true,
            cookies: {
                forward: "none",
            },
            headers: ["Host"],
        },
        compress: true,
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
    },
    orderedCacheBehaviors: [
        {
            pathPattern: "/n1/*",
            targetOriginId: "nextjs-app",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
                queryString: true,
                cookies: {
                    forward: "none",
                },
                headers: ["Host"],
            },
            compress: true,
            minTtl: 0,
            defaultTtl: 3600,
            maxTtl: 86400,
        },
        {
            pathPattern: "/_next/*",
            targetOriginId: "nextjs-app",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD"],
            forwardedValues: {
                queryString: true,
                cookies: {
                    forward: "none",
                },
                headers: ["Host"],
            },
            compress: true,
            minTtl: 0,
            defaultTtl: 3600,
            maxTtl: 86400,
        },
    ],
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
});

// Get the existing hosted zone
const hostedZone = aws.route53.getZoneOutput({ name: domainName });

// Create Route 53 record
const record = new aws.route53.Record("aliasRecord", {
    zoneId: hostedZone.id,
    name: domainName,
    type: "A",
    aliases: [
        {
            name: distribution.domainName,
            zoneId: distribution.hostedZoneId,
            evaluateTargetHealth: true,
        },
    ],
});

// Export the URLs and other important info
export const bucketUrl = bucket.websiteEndpoint;
export const cdnUrl = distribution.domainName;
export const aliasRecord = record.name;
